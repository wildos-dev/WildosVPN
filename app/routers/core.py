import asyncio
import json
import time

import commentjson
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from starlette.websockets import WebSocketDisconnect

from app import xray
from app.db import Session, get_db
from app.models.admin import Admin
from app.models.core import (
    CoreStats, 
    InboundValidationRequest, 
    InboundValidationResponse,
    InboundTemplatesResponse,
    InboundCreateRequest,
    InboundCreateResponse
)
from app.utils import responses
from app.utils.inbound_utils import (
    InboundValidator,
    InboundConfigGenerator,
    InboundTemplateManager,
    XrayConfigIntegration
)
from app.xray import XRayConfig
from config import XRAY_JSON

router = APIRouter(tags=["Core"], prefix="/api", responses={401: responses._401})


@router.websocket("/core/logs")
async def core_logs(websocket: WebSocket, db: Session = Depends(get_db)):
    token = websocket.query_params.get("token") or websocket.headers.get(
        "Authorization", ""
    ).removeprefix("Bearer ")
    admin = Admin.get_admin(token, db)
    if not admin:
        return await websocket.close(reason="Unauthorized", code=4401)

    if not admin.is_sudo:
        return await websocket.close(reason="You're not allowed", code=4403)

    interval = websocket.query_params.get("interval")
    if interval:
        try:
            interval = float(interval)
        except ValueError:
            return await websocket.close(reason="Invalid interval value", code=4400)
        if interval > 10:
            return await websocket.close(
                reason="Interval must be more than 0 and at most 10 seconds", code=4400
            )

    await websocket.accept()

    cache = ""
    last_sent_ts = 0
    with xray.core.get_logs() as logs:
        while True:
            if interval and time.time() - last_sent_ts >= interval and cache:
                try:
                    await websocket.send_text(cache)
                except (WebSocketDisconnect, RuntimeError):
                    break
                cache = ""
                last_sent_ts = time.time()

            if not logs:
                try:
                    await asyncio.wait_for(websocket.receive(), timeout=0.2)
                    continue
                except asyncio.TimeoutError:
                    continue
                except (WebSocketDisconnect, RuntimeError):
                    break

            log = logs.popleft()

            if interval:
                cache += f"{log}\n"
                continue

            try:
                await websocket.send_text(log)
            except (WebSocketDisconnect, RuntimeError):
                break


@router.get("/core", response_model=CoreStats)
def get_core_stats(admin: Admin = Depends(Admin.get_current)):
    """Retrieve core statistics such as version and uptime."""
    return CoreStats(
        version=xray.core.version,
        started=xray.core.started,
        logs_websocket=router.url_path_for("core_logs"),
    )


@router.post("/core/restart", responses={403: responses._403})
def restart_core(admin: Admin = Depends(Admin.check_sudo_admin)):
    """Restart the core and all connected nodes."""
    startup_config = xray.config.include_db_users()
    xray.core.restart(startup_config)

    for node_id, node in list(xray.nodes.items()):
        if node.connected:
            xray.operations.restart_node(node_id, startup_config)

    return {}


@router.post("/core/config/validate", response_model=InboundValidationResponse, responses={403: responses._403})
def validate_inbound_config(
    payload: InboundValidationRequest,
    admin: Admin = Depends(Admin.check_sudo_admin)
) -> InboundValidationResponse:
    """Validate inbound configuration before saving."""
    
    try:
        # Получение текущей конфигурации для проверки конфликтов
        with open(XRAY_JSON, "r") as f:
            current_config = commentjson.loads(f.read())
        
        existing_inbounds = XrayConfigIntegration.extract_existing_inbounds(current_config)
        existing_tags = XrayConfigIntegration.get_existing_tags(existing_inbounds)
        occupied_ports = XrayConfigIntegration.get_occupied_ports(existing_inbounds)
        
        # Добавление переданных существующих данных
        if payload.existing_tags:
            existing_tags.extend(payload.existing_tags)
        if payload.occupied_ports:
            occupied_ports.extend(payload.occupied_ports)
            
        # Валидация
        return InboundValidator.validate_config(
            payload.config,
            existing_tags,
            occupied_ports
        )
        
    except Exception as e:
        return InboundValidationResponse(
            is_valid=False,
            errors=[f"Ошибка валидации: {str(e)}"],
            warnings=[]
        )


@router.get("/core/templates", response_model=InboundTemplatesResponse, responses={403: responses._403})
def get_inbound_templates(
    admin: Admin = Depends(Admin.check_sudo_admin)
) -> InboundTemplatesResponse:
    """Get available inbound templates."""
    
    try:
        templates = InboundTemplateManager.get_base_templates()
        categories = InboundTemplateManager.get_template_categories()
        
        return InboundTemplatesResponse(
            templates=templates,
            categories=categories
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения шаблонов: {str(e)}")


@router.post("/core/inbounds", response_model=InboundCreateResponse, responses={403: responses._403})
def create_inbound(
    payload: InboundCreateRequest,
    admin: Admin = Depends(Admin.check_sudo_admin)
) -> InboundCreateResponse:
    """Create a new inbound configuration."""
    
    try:
        # Получение текущей конфигурации
        with open(XRAY_JSON, "r") as f:
            current_config = commentjson.loads(f.read())
        
        existing_inbounds = XrayConfigIntegration.extract_existing_inbounds(current_config)
        existing_tags = XrayConfigIntegration.get_existing_tags(existing_inbounds)
        occupied_ports = XrayConfigIntegration.get_occupied_ports(existing_inbounds)
        
        # Валидация
        validation = InboundValidator.validate_config(
            payload.config,
            existing_tags,
            occupied_ports
        )
        
        if not validation.is_valid:
            return InboundCreateResponse(
                success=False,
                message=f"Ошибки валидации: {'; '.join(validation.errors)}"
            )
        
        # Генерация финальной конфигурации
        if payload.template_id:
            # Если указан шаблон, используем его
            template = InboundTemplateManager.get_template_by_id(payload.template_id)
            
            if template:
                final_config = InboundConfigGenerator.merge_template_config(
                    template['base_config'],
                    {
                        'tag': payload.tag,
                        'port': payload.port,
                        **payload.config
                    }
                )
            else:
                return InboundCreateResponse(
                    success=False,
                    message=f"Шаблон {payload.template_id} не найден"
                )
        else:
            # Используем переданную конфигурацию как есть
            final_config = {
                'tag': payload.tag,
                'port': payload.port,
                'protocol': payload.protocol,
                **payload.config
            }
        
        # Добавление в конфигурацию
        updated_config = XrayConfigIntegration.add_inbound_to_config(current_config, final_config)
        
        # Валидация итоговой конфигурации Xray
        try:
            xray_config = XRayConfig(updated_config, api_port=xray.config.api_port)
        except ValueError as err:
            return InboundCreateResponse(
                success=False,
                message=f"Ошибка конфигурации Xray: {str(err)}"
            )
        
        # Сохранение конфигурации
        with open(XRAY_JSON, "w") as f:
            f.write(json.dumps(updated_config, indent=4))
        
        # Обновление глобальной конфигурации
        xray.config = xray_config
        
        # Перезапуск ядра
        startup_config = xray.config.include_db_users()
        xray.core.restart(startup_config)
        
        # Перезапуск узлов
        for node_id, node in list(xray.nodes.items()):
            if node.connected:
                xray.operations.restart_node(node_id, startup_config)
        
        return InboundCreateResponse(
            success=True,
            message="Инбаунд успешно создан и применен",
            inbound=final_config
        )
        
    except Exception as e:
        return InboundCreateResponse(
            success=False,
            message=f"Ошибка создания инбаунда: {str(e)}"
        )


@router.get("/core/config", responses={403: responses._403})
def get_core_config(admin: Admin = Depends(Admin.check_sudo_admin)) -> dict:
    """Get the current core configuration."""
    with open(XRAY_JSON, "r") as f:
        config = commentjson.loads(f.read())

    return config


@router.put("/core/config", responses={403: responses._403})
def modify_core_config(
    payload: dict, admin: Admin = Depends(Admin.check_sudo_admin)
) -> dict:
    """Modify the core configuration and restart the core."""
    try:
        config = XRayConfig(payload, api_port=xray.config.api_port)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

    xray.config = config
    with open(XRAY_JSON, "w") as f:
        f.write(json.dumps(payload, indent=4))

    startup_config = xray.config.include_db_users()
    xray.core.restart(startup_config)
    for node_id, node in list(xray.nodes.items()):
        if node.connected:
            xray.operations.restart_node(node_id, startup_config)

    xray.hosts.update()

    return payload

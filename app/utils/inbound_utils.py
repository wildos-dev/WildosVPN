"""
Утилиты для работы с конфигурациями инбаундов на серверной стороне
"""

import json
import re
import uuid
import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from copy import deepcopy

from app.models.core import InboundValidationResponse


class InboundValidator:
    """Валидатор инбаундов на серверной стороне"""
    
    # Системные зарезервированные порты
    RESERVED_PORTS = [22, 25, 53, 80, 110, 143, 443, 993, 995]
    
    @staticmethod
    def validate_config(
        config: Dict[str, Any],
        existing_tags: Optional[List[str]] = None,
        occupied_ports: Optional[List[int]] = None
    ) -> InboundValidationResponse:
        """Валидация конфигурации инбаунда"""
        
        if existing_tags is None:
            existing_tags = []
        if occupied_ports is None:
            occupied_ports = []
            
        errors = []
        warnings = []
        
        # Проверка обязательных полей
        if not config.get('tag'):
            errors.append("Поле 'tag' обязательно для заполнения")
        elif config['tag'] in existing_tags:
            errors.append(f"Инбаунд с тегом '{config['tag']}' уже существует")
        elif not InboundValidator._is_valid_tag(config['tag']):
            errors.append("Тег может содержать только буквы, цифры, подчеркивания и дефисы")
            
        if not config.get('port'):
            errors.append("Поле 'port' обязательно для заполнения")
        elif not InboundValidator._is_valid_port(config['port']):
            errors.append("Порт должен быть числом от 1 до 65535")
        elif config['port'] in InboundValidator.RESERVED_PORTS:
            warnings.append(f"Порт {config['port']} зарезервирован системой")
        elif config['port'] in occupied_ports:
            errors.append(f"Порт {config['port']} уже используется")
            
        if not config.get('protocol'):
            errors.append("Поле 'protocol' обязательно для заполнения")
        elif config['protocol'] not in ['vmess', 'vless', 'trojan', 'shadowsocks']:
            errors.append("Неподдерживаемый протокол")
            
        # Валидация структуры JSON
        try:
            json.dumps(config)
        except (TypeError, ValueError) as e:
            errors.append(f"Невалидная структура JSON: {str(e)}")
            
        # Проверка совместимости протокола и настроек
        validation_errors = InboundValidator._validate_protocol_compatibility(config)
        errors.extend(validation_errors)
        
        return InboundValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    @staticmethod
    def _is_valid_tag(tag: str) -> bool:
        """Проверка валидности тега"""
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, tag)) and len(tag) <= 32
    
    @staticmethod
    def _is_valid_port(port: Any) -> bool:
        """Проверка валидности порта"""
        try:
            port_num = int(port)
            return 1 <= port_num <= 65535
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def _validate_protocol_compatibility(config: Dict[str, Any]) -> List[str]:
        """Проверка совместимости протокола с настройками"""
        errors = []
        protocol = config.get('protocol')
        
        if protocol in ['vmess', 'vless']:
            # Проверка наличия UUID
            clients = config.get('settings', {}).get('clients', [])
            if clients and not any(client.get('id') for client in clients):
                errors.append(f"Протокол {protocol} требует UUID в настройках клиентов")
                
        elif protocol == 'trojan':
            # Проверка наличия пароля
            clients = config.get('settings', {}).get('clients', [])
            if clients and not any(client.get('password') for client in clients):
                errors.append("Протокол trojan требует пароль в настройках клиентов")
                
        elif protocol == 'shadowsocks':
            # Проверка пароля и метода
            settings = config.get('settings', {})
            if not settings.get('password'):
                errors.append("Протокол shadowsocks требует пароль")
            if not settings.get('method'):
                errors.append("Протокол shadowsocks требует метод шифрования")
        
        # Проверка XTLS Vision ограничений
        stream_settings = config.get('streamSettings', {})
        security = stream_settings.get('security')
        network = stream_settings.get('network')
        
        if security == 'reality':
            reality_settings = stream_settings.get('realitySettings', {})
            if not reality_settings.get('privateKey'):
                errors.append("Reality требует privateKey")
            if not reality_settings.get('shortIds'):
                errors.append("Reality требует shortIds")
                
        # Проверка flow с mux
        if protocol == 'vless':
            clients = config.get('settings', {}).get('clients', [])
            has_flow = any(client.get('flow') for client in clients)
            mux_enabled = stream_settings.get('muxSettings', {}).get('enabled', False)
            
            if has_flow and mux_enabled:
                errors.append("XTLS flow не совместим с мультиплексированием")
        
        return errors


class InboundConfigGenerator:
    """Генератор конфигураций инбаундов"""
    
    @staticmethod
    def generate_uuid() -> str:
        """Генерация UUID v4"""
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_password(length: int = 12) -> str:
        """Генерация безопасного пароля"""
        import secrets
        import string
        
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(chars) for _ in range(length))
    
    @staticmethod
    def generate_reality_keys() -> Tuple[str, str]:
        """Генерация ключей для Reality"""
        # Заглушка - в реальной реализации нужно использовать Xray утилиты
        private_key = InboundConfigGenerator.generate_password(32)
        public_key = InboundConfigGenerator.generate_password(32)
        return private_key, public_key
    
    @staticmethod
    def merge_template_config(
        template_config: Dict[str, Any],
        user_data: Dict[str, Any],
        auto_generate: bool = True
    ) -> Dict[str, Any]:
        """Слияние шаблона с пользовательскими данными"""
        
        config = deepcopy(template_config)
        
        # Применение пользовательских данных
        config['tag'] = user_data.get('tag', config.get('tag'))
        config['port'] = user_data.get('port', config.get('port'))
        
        # Автогенерация значений
        if auto_generate:
            protocol = config.get('protocol')
            
            if protocol in ['vmess', 'vless']:
                # Генерация UUID для клиентов
                clients = config.setdefault('settings', {}).setdefault('clients', [{}])
                for client in clients:
                    if not client.get('id'):
                        client['id'] = InboundConfigGenerator.generate_uuid()
                        
            elif protocol == 'trojan':
                # Генерация пароля для trojan
                clients = config.setdefault('settings', {}).setdefault('clients', [{}])
                for client in clients:
                    if not client.get('password'):
                        client['password'] = InboundConfigGenerator.generate_password()
                        
            elif protocol == 'shadowsocks':
                # Генерация пароля для shadowsocks
                settings = config.setdefault('settings', {})
                if not settings.get('password'):
                    settings['password'] = InboundConfigGenerator.generate_password()
        
        # Применение дополнительных настроек от пользователя
        user_settings = user_data.get('settings', {})
        if user_settings:
            config.setdefault('settings', {}).update(user_settings)
            
        user_stream_settings = user_data.get('streamSettings', {})
        if user_stream_settings:
            config.setdefault('streamSettings', {}).update(user_stream_settings)
        
        return config


class InboundTemplateManager:
    """Менеджер шаблонов инбаундов"""
    
    from config import INBOUND_TEMPLATES_DIRECTORY, CUSTOM_TEMPLATES_DIRECTORY
    
    TEMPLATES_DIR = INBOUND_TEMPLATES_DIRECTORY
    CATEGORIES_FILE = "categories.json"
    TEMPLATE_DIRS = ["basic", "websocket", "grpc", "reality", "modern", "special", "production"]
    CUSTOM_TEMPLATES_DIR = CUSTOM_TEMPLATES_DIRECTORY
    
    @staticmethod
    def _validate_template(template: Dict[str, Any]) -> bool:
        """Валидация структуры шаблона"""
        required_fields = [
            'id', 'name', 'description', 'protocol', 'transport', 'security',
            'category', 'complexity', 'base_config', 'required_fields',
            'auto_gen_fields', 'editable_fields', 'advanced_fields'
        ]
        
        for field in required_fields:
            if field not in template:
                return False
                
        # Проверка допустимых значений
        if template.get('protocol') not in ['vmess', 'vless', 'trojan', 'shadowsocks']:
            return False
            
        if template.get('complexity') not in ['easy', 'medium', 'advanced']:
            return False
            
        return True
    
    @staticmethod
    def _load_templates_from_dir(template_dir: str) -> List[Dict[str, Any]]:
        """Загрузка шаблонов из директории"""
        import os
        import json
        from pathlib import Path
        
        templates = []
        templates_path = Path(InboundTemplateManager.TEMPLATES_DIR) / template_dir
        
        if not templates_path.exists():
            return templates
            
        for template_file in templates_path.glob("*.json"):
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
                    
                # Валидация структуры шаблона
                is_valid, errors = TemplateValidator.validate_template_structure(template_data)
                if is_valid:
                    # Дополнительная валидация совместимости
                    is_compatible, warnings = TemplateValidator.validate_template_compatibility(template_data)
                    if warnings:
                        print(f"Предупреждения для шаблона {template_file}: {'; '.join(warnings)}")
                    templates.append(template_data)
                else:
                    print(f"Невалидный шаблон {template_file}: {'; '.join(errors)}")
                    
            except (json.JSONDecodeError, IOError) as e:
                print(f"Ошибка загрузки шаблона {template_file}: {e}")
                
        return templates
    
    @staticmethod
    def get_base_templates() -> List[Dict[str, Any]]:
        """Получение всех доступных шаблонов из файлов"""
        all_templates = []
        
        for template_dir in InboundTemplateManager.TEMPLATE_DIRS:
            templates = InboundTemplateManager._load_templates_from_dir(template_dir)
            all_templates.extend(templates)
            
        # Если файлы недоступны, возвращаем хардкод как fallback
        if not all_templates:
            return InboundTemplateManager._get_fallback_templates()
            
        return all_templates
    
    @staticmethod
    def _get_fallback_templates() -> List[Dict[str, Any]]:
        """Резервные шаблоны если файлы недоступны"""
        return [
            {
                "id": "vmess_tcp_basic",
                "name": "VMess TCP Basic",
                "protocol": "vmess",
                "transport": "tcp",
                "security": "none",
                "category": "vmess",
                "base_config": {
                    "protocol": "vmess",
                    "settings": {
                        "clients": [{"level": 0, "alterId": 0}]
                    },
                    "streamSettings": {"network": "tcp"},
                    "sniffing": {"enabled": True, "destOverride": ["http", "tls"]}
                },
                "required_fields": ["tag", "port"],
                "auto_gen_fields": ["clients.0.id"],
                "editable_fields": ["clients.0.level", "clients.0.alterId"],
                "advanced_fields": [],
                "restrictions": [],
                "description": "Базовая конфигурация VMess через TCP",
                "icon": "📡",
                "complexity": "easy",
                "cdn_support": False,
                "multiplexing": True,
                "default_port": 10001,
                "tags": ["basic", "vmess", "tcp"]
            }
        ]
    
    @staticmethod
    def get_template_categories() -> List[Dict[str, Any]]:
        """Получение категорий шаблонов из файла"""
        import json
        from pathlib import Path
        
        categories_path = Path(InboundTemplateManager.TEMPLATES_DIR) / InboundTemplateManager.CATEGORIES_FILE
        
        try:
            with open(categories_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                categories = data.get('categories', [])
                
            # Подсчет количества шаблонов в каждой категории
            templates = InboundTemplateManager.get_base_templates()
            for category in categories:
                category_protocols = category.get('protocols', [])
                category_id = category.get('id', '')
                count = sum(1 for template in templates 
                           if template.get('category') == category_id or 
                              template.get('protocol') in category_protocols)
                category['count'] = count
                
            return categories
            
        except (json.JSONDecodeError, IOError) as e:
            print(f"Ошибка загрузки категорий: {e}")
            return InboundTemplateManager._get_fallback_categories()
    
    @staticmethod
    def _get_fallback_categories() -> List[Dict[str, Any]]:
        """Резервные категории если файл недоступен (7 категорий согласно этапу 5)"""
        return [
            {
                "id": "basic",
                "name": "Базовые шаблоны",
                "description": "Простые конфигурации для быстрого старта - VMess TCP, VLESS TCP, Trojan TLS, Shadowsocks TCP",
                "icon": "🚀",
                "protocols": ["vmess", "vless", "trojan", "shadowsocks"],
                "count": 0
            },
            {
                "id": "websocket",
                "name": "WebSocket шаблоны",
                "description": "Конфигурации с CDN поддержкой - VMess WS, VLESS WS, Trojan WS, SS WS",
                "icon": "🌐",
                "protocols": ["vmess", "vless", "trojan", "shadowsocks"],
                "count": 0
            },
            {
                "id": "grpc",
                "name": "gRPC шаблоны",
                "description": "Продвинутые конфигурации - VMess gRPC, VLESS gRPC, VLESS gRPC Reality, Trojan gRPC",
                "icon": "📡",
                "protocols": ["vmess", "vless", "trojan"],
                "count": 0
            },
            {
                "id": "reality",
                "name": "Reality шаблоны",
                "description": "Максимальная скрытность - VLESS TCP Reality, VLESS XTLS Vision, VLESS gRPC Reality, VLESS HTTPUpgrade Reality",
                "icon": "👻",
                "protocols": ["vless"],
                "count": 0
            },
            {
                "id": "modern",
                "name": "Современные транспорты",
                "description": "Новые технологии - VLESS HTTPUpgrade, VLESS SplitHTTP, VLESS SplitHTTP H3, VMess mKCP",
                "icon": "⚡",
                "protocols": ["vless", "vmess"],
                "count": 0
            },
            {
                "id": "shadowsocks2022",
                "name": "Shadowsocks 2022",
                "description": "Новое поколение SS - SS2022 TCP, SS2022 Multi-user, SS2022 UoT, SS2022 Relay",
                "icon": "🔒",
                "protocols": ["shadowsocks"],
                "count": 0
            },
            {
                "id": "special",
                "name": "Специальные конфигурации",
                "description": "Экспертные шаблоны - All-in-One Fallbacks, XHTTP Reality, H3-To-H2C Caddy, Noise Fragment",
                "icon": "🎯",
                "protocols": ["vless", "vmess"],
                "count": 0
            }
        ]
    
    @staticmethod
    def get_template_by_id(template_id: str) -> Optional[Dict[str, Any]]:
        """Получение шаблона по ID"""
        templates = InboundTemplateManager.get_base_templates()
        return next((t for t in templates if t['id'] == template_id), None)
    
    @staticmethod
    def get_templates_by_category(category_id: str) -> List[Dict[str, Any]]:
        """Получение шаблонов по категории"""
        templates = InboundTemplateManager.get_base_templates()
        categories = InboundTemplateManager.get_template_categories()
        
        category = next((c for c in categories if c['id'] == category_id), None)
        if not category:
            return []
            
        category_protocols = category.get('protocols', [])
        return [t for t in templates if t.get('protocol') in category_protocols]


class TemplateValidator:
    """Валидатор шаблонов инбаундов"""
    
    @staticmethod
    def validate_template_structure(template: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Полная валидация структуры шаблона"""
        errors = []
        
        # Проверка обязательных полей верхнего уровня
        required_fields = [
            'id', 'name', 'description', 'protocol', 'transport', 'security',
            'category', 'complexity', 'base_config', 'required_fields',
            'auto_gen_fields', 'editable_fields', 'advanced_fields'
        ]
        
        for field in required_fields:
            if field not in template:
                errors.append(f"Отсутствует обязательное поле: {field}")
        
        # Проверка типов полей
        if not isinstance(template.get('base_config'), dict):
            errors.append("base_config должен быть объектом")
            
        for list_field in ['required_fields', 'auto_gen_fields', 'editable_fields', 'advanced_fields']:
            if not isinstance(template.get(list_field), list):
                errors.append(f"{list_field} должен быть массивом")
        
        # Проверка допустимых значений
        valid_protocols = ['vmess', 'vless', 'trojan', 'shadowsocks']
        if template.get('protocol') not in valid_protocols:
            errors.append(f"Недопустимый протокол. Допустимые: {valid_protocols}")
        
        valid_complexities = ['easy', 'medium', 'advanced']
        if template.get('complexity') not in valid_complexities:
            errors.append(f"Недопустимая сложность. Допустимые: {valid_complexities}")
        
        # Проверка структуры base_config
        base_config = template.get('base_config', {})
        if 'protocol' not in base_config:
            errors.append("base_config должен содержать поле protocol")
            
        if base_config.get('protocol') != template.get('protocol'):
            errors.append("protocol в base_config должен совпадать с protocol шаблона")
        
        # Проверка ID на уникальность (в рамках одной загрузки)
        template_id = template.get('id', '')
        if not template_id or not isinstance(template_id, str):
            errors.append("ID шаблона должен быть непустой строкой")
        elif not template_id.replace('_', '').replace('-', '').isalnum():
            errors.append("ID шаблона может содержать только буквы, цифры, _ и -")
        
        return len(errors) == 0, errors
    
    @staticmethod 
    def validate_template_compatibility(template: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Валидация совместимости настроек шаблона"""
        warnings = []
        errors = []
        
        protocol = template.get('protocol')
        base_config = template.get('base_config', {})
        stream_settings = base_config.get('streamSettings', {})
        
        # Проверка XTLS с мультиплексированием
        if protocol == 'vless':
            clients = base_config.get('settings', {}).get('clients', [])
            has_flow = any(client.get('flow') for client in clients)
            mux_enabled = stream_settings.get('muxSettings', {}).get('enabled', False)
            
            if has_flow and mux_enabled:
                errors.append("XTLS flow не совместим с мультиплексированием")
        
        # Проверка Reality настроек
        if stream_settings.get('security') == 'reality':
            reality_settings = stream_settings.get('realitySettings', {})
            if not reality_settings.get('privateKey'):
                warnings.append("Reality требует настройки privateKey")
            if not reality_settings.get('shortIds'):
                warnings.append("Reality требует настройки shortIds")
        
        # Проверка TLS настроек
        if stream_settings.get('security') == 'tls':
            tls_settings = stream_settings.get('tlsSettings', {})
            if not tls_settings.get('certificates'):
                warnings.append("TLS требует настройки сертификатов")
        
        # Проверка Shadowsocks методов
        if protocol == 'shadowsocks':
            method = base_config.get('settings', {}).get('method')
            if method and method.startswith('2022-'):
                warnings.append("Shadowsocks 2022 методы требуют совместимые клиенты")
        
        return len(errors) == 0, errors + warnings


class XrayConfigIntegration:
    """Интеграция с существующей конфигурацией Xray"""
    
    @staticmethod
    def extract_existing_inbounds(xray_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Извлечение существующих инбаундов из конфигурации"""
        return xray_config.get('inbounds', [])
    
    @staticmethod
    def get_occupied_ports(inbounds: List[Dict[str, Any]]) -> List[int]:
        """Получение занятых портов"""
        ports = []
        for inbound in inbounds:
            port = inbound.get('port')
            if port:
                ports.append(int(port))
        return ports
    
    @staticmethod
    def get_existing_tags(inbounds: List[Dict[str, Any]]) -> List[str]:
        """Получение существующих тегов"""
        tags = []
        for inbound in inbounds:
            tag = inbound.get('tag')
            if tag:
                tags.append(tag)
        return tags
    
    @staticmethod
    def add_inbound_to_config(
        xray_config: Dict[str, Any],
        new_inbound: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Добавление нового инбаунда в конфигурацию"""
        config = deepcopy(xray_config)
        config.setdefault('inbounds', []).append(new_inbound)
        return config
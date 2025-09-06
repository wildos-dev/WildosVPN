from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class CoreStats(BaseModel):
    version: str
    started: bool
    logs_websocket: str


class InboundValidationRequest(BaseModel):
    config: Dict[str, Any]
    existing_tags: Optional[List[str]] = []
    occupied_ports: Optional[List[int]] = []


class InboundValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []


class InboundTemplate(BaseModel):
    id: str
    name: str
    protocol: str
    transport: str
    security: str
    category: str
    base_config: Dict[str, Any]
    required_fields: List[str]
    auto_gen_fields: List[str]
    editable_fields: List[str]
    advanced_fields: List[str]
    restrictions: List[str] = []
    description: str
    icon: str
    complexity: str
    cdn_support: bool
    multiplexing: bool
    default_port: Optional[int] = None
    tags: List[str] = []


class InboundTemplatesResponse(BaseModel):
    templates: List[InboundTemplate]
    categories: List[Dict[str, Any]]


class InboundCreateRequest(BaseModel):
    tag: str
    port: int
    protocol: str
    template_id: Optional[str] = None
    config: Dict[str, Any]


class InboundCreateResponse(BaseModel):
    success: bool
    message: str
    inbound: Optional[Dict[str, Any]] = None

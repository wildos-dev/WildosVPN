// Базовые типы для системы управления инбаундами
export type ProtocolType = "vmess" | "vless" | "trojan" | "shadowsocks";
export type TransportType = "tcp" | "ws" | "grpc" | "http" | "splithttp" | "httpupgrade" | "kcp" | "xhttp";
export type SecurityType = "none" | "tls" | "reality";
export type ComplexityLevel = "easy" | "medium" | "advanced";

// Основной интерфейс шаблона инбаунда
export interface InboundTemplate {
  id: string;
  name: string;
  protocol: ProtocolType;
  transport: TransportType;
  security: SecurityType;
  category: string;
  baseConfig: Record<string, any>; // Готовая JSON структура Xray
  requiredFields: string[]; // tag, port всегда обязательны
  autoGenFields: string[]; // UUID, passwords - автогенерация  
  editableFields: string[]; // Безопасные для редактирования
  advancedFields: string[]; // fragment_setting, noise_setting
  restrictions: string[]; // Ограничения и предупреждения
  description: string;
  icon: string;
  complexity: ComplexityLevel;
  cdnSupport: boolean; // Поддержка CDN
  multiplexing: boolean; // Встроенное мультиплексирование
  defaultPort?: number; // Рекомендуемый порт
  tags?: string[]; // Теги для поиска и фильтрации
}

// Конфигурация инбаунда для создания/редактирования
export interface InboundConfig {
  tag: string;
  port: number;
  protocol: ProtocolType;
  settings: Record<string, any>;
  streamSettings?: Record<string, any>;
  sniffing?: Record<string, any>;
  fallbacks?: Array<Record<string, any>>;
}

// Форма редактирования инбаунда
export interface InboundFormData {
  templateId: string;
  tag: string;
  port: number;
  editableValues: Record<string, any>;
  advancedValues: Record<string, any>;
}

// Категории шаблонов
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  protocols: ProtocolType[];
  count: number;
}

// Состояние менеджера инбаундов
export interface InboundManagerState {
  mode: 'list' | 'create' | 'edit' | 'duplicate';
  selectedTemplate?: InboundTemplate;
  editingInbound?: InboundConfig;
  existingInbounds: InboundConfig[];
  categories: TemplateCategory[];
  templates: InboundTemplate[];
}

// Ошибки валидации
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Результат валидации
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

// Результат операции с инбаундом
export interface InboundOperationResult {
  success: boolean;
  message: string;
  data?: InboundConfig;
  errors?: ValidationError[];
}

// Настройки автогенерации
export interface AutoGenSettings {
  generateUUID: boolean;
  generatePasswords: boolean;
  passwordLength: number;
  useSecureDefaults: boolean;
}

// Конфигурация порта
export interface PortConfig {
  port: number;
  isAvailable: boolean;
  isReserved: boolean;
  conflictsWith?: string[]; // Теги инбаундов, которые используют этот порт
}

// Ограничения протоколов
export interface ProtocolRestrictions {
  protocol: ProtocolType;
  transport: TransportType;
  security: SecurityType;
  allowsMux: boolean;
  allowsFlow: boolean;
  requiredFields: string[];
  incompatibleWith?: {
    transports?: TransportType[];
    securities?: SecurityType[];
    features?: string[];
  };
}

// Мета-информация о транспорте
export interface TransportMetadata {
  transport: TransportType;
  displayName: string;
  description: string;
  icon: string;
  supportsCDN: boolean;
  supportsHTTP3: boolean;
  complexity: ComplexityLevel;
  recommendedFor: string[];
}

// Экспорт констант
export const PROTOCOLS: ProtocolType[] = ["vmess", "vless", "trojan", "shadowsocks"];
export const TRANSPORTS: TransportType[] = ["tcp", "ws", "grpc", "http", "splithttp", "httpupgrade", "kcp", "xhttp"];
export const SECURITIES: SecurityType[] = ["none", "tls", "reality"];
export const COMPLEXITY_LEVELS: ComplexityLevel[] = ["easy", "medium", "advanced"];
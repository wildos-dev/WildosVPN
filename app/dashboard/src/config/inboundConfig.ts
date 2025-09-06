// Конфигурационная система для инбаундов
// Константы, ограничения, автогенерация и системные настройки

import type { 
  ProtocolType, 
  TransportType, 
  SecurityType, 
  ProtocolRestrictions,
  TransportMetadata,
  TemplateCategory,
  AutoGenSettings 
} from '../types/InboundTypes';

// Константы протоколов
export const PROTOCOL_CONFIG = {
  vmess: {
    displayName: 'VMess',
    description: 'Универсальный протокол с высокой совместимостью',
    icon: '📡',
    requiresAuth: true,
    authField: 'uuid',
    defaultSecurity: 'none' as SecurityType,
    supportedTransports: ['tcp', 'ws', 'grpc', 'http', 'kcp'] as TransportType[],
    supportedSecurities: ['none', 'tls'] as SecurityType[]
  },
  vless: {
    displayName: 'VLESS',
    description: 'Легкий протокол с минимальными накладными расходами',
    icon: '⚡',
    requiresAuth: true,
    authField: 'uuid',
    defaultSecurity: 'none' as SecurityType,
    supportedTransports: ['tcp', 'ws', 'grpc', 'splithttp', 'httpupgrade', 'kcp', 'xhttp'] as TransportType[],
    supportedSecurities: ['none', 'tls', 'reality'] as SecurityType[]
  },
  trojan: {
    displayName: 'Trojan',
    description: 'Протокол маскировки под HTTPS трафик',
    icon: '🛡️',
    requiresAuth: true,
    authField: 'password',
    defaultSecurity: 'tls' as SecurityType,
    supportedTransports: ['tcp', 'ws', 'grpc'] as TransportType[],
    supportedSecurities: ['tls'] as SecurityType[]
  },
  shadowsocks: {
    displayName: 'Shadowsocks',
    description: 'Проверенный протокол с сильным шифрованием',
    icon: '🔒',
    requiresAuth: true,
    authField: 'password',
    defaultSecurity: 'none' as SecurityType,
    supportedTransports: ['tcp', 'ws', 'grpc'] as TransportType[],
    supportedSecurities: ['none', 'tls'] as SecurityType[]
  }
} as const;

// Конфигурация транспортов
export const TRANSPORT_CONFIG: Record<TransportType, TransportMetadata> = {
  tcp: {
    transport: 'tcp',
    displayName: 'TCP',
    description: 'Надежное соединение, высокая производительность',
    icon: '🔗',
    supportsCDN: false,
    supportsHTTP3: false,
    complexity: 'easy',
    recommendedFor: ['Высокая производительность', 'Стабильность', 'Простота настройки']
  },
  ws: {
    transport: 'ws',
    displayName: 'WebSocket',
    description: 'Совместимость с CDN, обход блокировок',
    icon: '🌐',
    supportsCDN: true,
    supportsHTTP3: false,
    complexity: 'easy',
    recommendedFor: ['CDN поддержка', 'Cloudflare', 'Обход блокировок']
  },
  grpc: {
    transport: 'grpc',
    displayName: 'gRPC',
    description: 'Современный протокол с мультиплексированием',
    icon: '📡',
    supportsCDN: true,
    supportsHTTP3: false,
    complexity: 'medium',
    recommendedFor: ['Мультиплексирование', 'CDN совместимость', 'Производительность']
  },
  http: {
    transport: 'http',
    displayName: 'HTTP/2',
    description: 'Прямой HTTP/2 транспорт',
    icon: '🌍',
    supportsCDN: false,
    supportsHTTP3: false,
    complexity: 'medium',
    recommendedFor: ['HTTP/2 оптимизация', 'Обфускация']
  },
  splithttp: {
    transport: 'splithttp',
    displayName: 'SplitHTTP',
    description: 'Разделенный HTTP для CDN совместимости',
    icon: '🔄',
    supportsCDN: true,
    supportsHTTP3: true,
    complexity: 'advanced',
    recommendedFor: ['CDN', 'HTTP/3 поддержка', 'Caddy/Nginx']
  },
  httpupgrade: {
    transport: 'httpupgrade',
    displayName: 'HTTPUpgrade',
    description: 'Обновленный HTTP транспорт против блокировок',
    icon: '⬆️',
    supportsCDN: true,
    supportsHTTP3: false,
    complexity: 'medium',
    recommendedFor: ['Антиблокировка', 'Современные фильтры', 'CDN поддержка']
  },
  kcp: {
    transport: 'kcp',
    displayName: 'mKCP',
    description: 'UDP транспорт с обфускацией',
    icon: '⚡',
    supportsCDN: false,
    supportsHTTP3: false,
    complexity: 'advanced',
    recommendedFor: ['UDP оптимизация', 'Высокая скорость', 'Обфускация']
  },
  xhttp: {
    transport: 'xhttp',
    displayName: 'XHTTP',
    description: 'Экспериментальный HTTP транспорт',
    icon: '🧪',
    supportsCDN: false,
    supportsHTTP3: true,
    complexity: 'advanced',
    recommendedFor: ['Эксперименты', 'HTTP/3', 'Новые возможности']
  }
};

// Конфигурация безопасности
export const SECURITY_CONFIG = {
  none: {
    displayName: 'Без шифрования',
    description: 'Без дополнительного шифрования (не рекомендуется)',
    icon: '🔓',
    complexity: 'easy',
    requiresCertificates: false
  },
  tls: {
    displayName: 'TLS',
    description: 'Стандартное TLS шифрование',
    icon: '🔐',
    complexity: 'medium',
    requiresCertificates: true
  },
  reality: {
    displayName: 'Reality',
    description: 'Продвинутая маскировка TLS трафика',
    icon: '👻',
    complexity: 'advanced',
    requiresCertificates: false
  }
} as const;

// Ограничения протоколов и совместимости
export const PROTOCOL_RESTRICTIONS: ProtocolRestrictions[] = [
  {
    protocol: 'vless',
    transport: 'tcp',
    security: 'reality',
    allowsMux: false, // XTLS Vision не поддерживает Mux
    allowsFlow: true,
    requiredFields: ['uuid'],
    incompatibleWith: {
      features: ['mux_when_xtls_vision']
    }
  },
  {
    protocol: 'vless',
    transport: 'grpc',
    security: 'reality',
    allowsMux: true, // gRPC поддерживает автоMux
    allowsFlow: false,
    requiredFields: ['uuid', 'serviceName']
  },
  {
    protocol: 'trojan',
    transport: 'tcp',
    security: 'tls',
    allowsMux: true,
    allowsFlow: false,
    requiredFields: ['password']
  },
  {
    protocol: 'vmess',
    transport: 'ws',
    security: 'tls',
    allowsMux: true,
    allowsFlow: false,
    requiredFields: ['uuid'],
    incompatibleWith: {
      securities: ['reality'] // VMess не поддерживает Reality
    }
  },
  {
    protocol: 'shadowsocks',
    transport: 'tcp',
    security: 'none',
    allowsMux: false,
    allowsFlow: false,
    requiredFields: ['password', 'method']
  }
];

// Категории шаблонов (7 категорий согласно этапу 5)
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'basic',
    name: 'Базовые шаблоны',
    description: 'Простые конфигурации для быстрого старта - VMess TCP, VLESS TCP, Trojan TLS, Shadowsocks TCP',
    icon: '🚀',
    protocols: ['vmess', 'vless', 'trojan', 'shadowsocks'],
    count: 0
  },
  {
    id: 'websocket',
    name: 'WebSocket шаблоны',
    description: 'Конфигурации с CDN поддержкой - VMess WS, VLESS WS, Trojan WS, SS WS',
    icon: '🌐',
    protocols: ['vmess', 'vless', 'trojan', 'shadowsocks'],
    count: 0
  },
  {
    id: 'grpc',
    name: 'gRPC шаблоны',
    description: 'Продвинутые конфигурации - VMess gRPC, VLESS gRPC, VLESS gRPC Reality, Trojan gRPC',
    icon: '📡',
    protocols: ['vmess', 'vless', 'trojan'],
    count: 0
  },
  {
    id: 'reality',
    name: 'Reality шаблоны',
    description: 'Максимальная скрытность - VLESS TCP Reality, VLESS XTLS Vision, VLESS gRPC Reality, VLESS HTTPUpgrade Reality',
    icon: '👻',
    protocols: ['vless'],
    count: 0
  },
  {
    id: 'modern',
    name: 'Современные транспорты',
    description: 'Новые технологии - VLESS HTTPUpgrade, VLESS SplitHTTP, VLESS SplitHTTP H3, VMess mKCP',
    icon: '⚡',
    protocols: ['vless', 'vmess'],
    count: 0
  },
  {
    id: 'shadowsocks2022',
    name: 'Shadowsocks 2022',
    description: 'Новое поколение SS - SS2022 TCP, SS2022 Multi-user, SS2022 UoT, SS2022 Relay',
    icon: '🔒',
    protocols: ['shadowsocks'],
    count: 0
  },
  {
    id: 'special',
    name: 'Специальные конфигурации',
    description: 'Экспертные шаблоны - All-in-One Fallbacks, XHTTP Reality, H3-To-H2C Caddy, Noise Fragment',
    icon: '🎯',
    protocols: ['vless', 'vmess'],
    count: 0
  }
];

// Настройки автогенерации
export const DEFAULT_AUTOGEN_SETTINGS: AutoGenSettings = {
  generateUUID: true,
  generatePasswords: true,
  passwordLength: 12,
  useSecureDefaults: true
};

// Утилиты для генерации значений
export const GenerationUtils = {
  // Генерация UUID v4
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Генерация безопасного пароля
  generatePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Генерация случайного порта
  generateRandomPort(excludePorts: number[] = []): number {
    const minPort = 10000;
    const maxPort = 65535;
    const reservedPorts = [22, 25, 53, 80, 110, 143, 443, 993, 995, ...excludePorts];
    
    let port: number;
    do {
      port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
    } while (reservedPorts.includes(port));
    
    return port;
  },

  // Генерация уникального тега
  generateUniqueTag(baseName: string, existingTags: string[] = []): string {
    let counter = 1;
    let tag = baseName;
    
    while (existingTags.includes(tag)) {
      tag = `${baseName}_${counter}`;
      counter++;
    }
    
    return tag;
  }
};

// Системные лимиты и настройки
export const SYSTEM_LIMITS = {
  maxInbounds: 50, // Максимальное количество инбаундов
  maxTagLength: 32,
  maxPasswordLength: 128,
  defaultTimeout: 30, // Секунды для операций
  maxTemplatesPerCategory: 20
} as const;

// Рекомендуемые порты для разных сценариев
export const RECOMMENDED_PORTS = {
  development: [8080, 8081, 8082, 8083, 8084],
  production: [443, 2053, 2083, 2087, 2096, 8443],
  custom: [10000, 10001, 10002, 10003, 10004]
} as const;

// Утилиты для работы с ограничениями
export const RestrictionUtils = {
  // Проверка совместимости протокола и транспорта
  isTransportSupported(protocol: ProtocolType, transport: TransportType): boolean {
    return PROTOCOL_CONFIG[protocol].supportedTransports.includes(transport);
  },

  // Проверка совместимости протокола и безопасности
  isSecuritySupported(protocol: ProtocolType, security: SecurityType): boolean {
    return PROTOCOL_CONFIG[protocol].supportedSecurities.includes(security);
  },

  // Получение ограничений для комбинации
  getRestrictions(protocol: ProtocolType, transport: TransportType, security: SecurityType): ProtocolRestrictions | undefined {
    return PROTOCOL_RESTRICTIONS.find(r => 
      r.protocol === protocol && 
      r.transport === transport && 
      r.security === security
    );
  },

  // Проверка поддержки мультиплексирования
  supportsMux(protocol: ProtocolType, transport: TransportType, security: SecurityType): boolean {
    const restriction = this.getRestrictions(protocol, transport, security);
    return restriction?.allowsMux ?? true;
  },

  // Проверка поддержки flow
  supportsFlow(protocol: ProtocolType, transport: TransportType, security: SecurityType): boolean {
    const restriction = this.getRestrictions(protocol, transport, security);
    return restriction?.allowsFlow ?? false;
  },

  // Получение обязательных полей
  getRequiredFields(protocol: ProtocolType, transport: TransportType, security: SecurityType): string[] {
    const restriction = this.getRestrictions(protocol, transport, security);
    return restriction?.requiredFields ?? ['tag', 'port'];
  }
};

// Экспорт всех утилит
export const InboundConfigUtils = {
  GenerationUtils,
  RestrictionUtils,
  PROTOCOL_CONFIG,
  TRANSPORT_CONFIG,
  SECURITY_CONFIG,
  TEMPLATE_CATEGORIES,
  DEFAULT_AUTOGEN_SETTINGS,
  SYSTEM_LIMITS,
  RECOMMENDED_PORTS
};
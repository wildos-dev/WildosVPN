// Схемы валидации для инбаундов
// Простая валидация без внешних зависимостей

import type { 
  InboundFormData, 
  InboundConfig, 
  ValidationResult, 
  ValidationError,
  ProtocolType,
  TransportType,
  SecurityType 
} from '../types/InboundTypes';

// Базовые регексы для валидации
export const VALIDATION_PATTERNS = {
  tag: /^[a-zA-Z0-9_-]+$/, // Буквы, цифры, подчеркивания, дефисы
  port: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/, // 1-65535
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  password: /^.{6,}$/, // Минимум 6 символов
  serviceName: /^[a-zA-Z0-9_.-]+$/, // Для gRPC serviceName
  path: /^\/[a-zA-Z0-9._/-]*$/, // Путь должен начинаться с /
  host: /^[a-zA-Z0-9.-]+$/, // Базовая валидация хоста
  fragmentPattern: /^(\d+-\d+|\d+|random)$/, // Паттерн фрагментации
  noisePattern: /^[a-fA-F0-9]{1,32}$/, // Шум в hex формате
};

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  tag: {
    required: 'Тег обязателен для заполнения',
    invalid: 'Тег может содержать только буквы, цифры, подчеркивания и дефисы',
    duplicate: 'Инбаунд с таким тегом уже существует',
    length: 'Тег должен быть от 1 до 32 символов'
  },
  port: {
    required: 'Порт обязателен для заполнения',
    invalid: 'Порт должен быть числом от 1 до 65535',
    occupied: 'Порт уже используется другим инбаундом',
    reserved: 'Порт зарезервирован системой'
  },
  uuid: {
    required: 'UUID обязателен для протоколов VMess и VLESS',
    invalid: 'Неверный формат UUID'
  },
  password: {
    required: 'Пароль обязателен для протоколов Trojan и Shadowsocks',
    invalid: 'Пароль должен содержать минимум 6 символов'
  },
  serviceName: {
    required: 'Service Name обязателен для gRPC транспорта',
    invalid: 'Service Name может содержать только буквы, цифры, точки, дефисы и подчеркивания'
  },
  path: {
    invalid: 'Путь должен начинаться с / и содержать только допустимые символы'
  },
  host: {
    invalid: 'Неверный формат хоста'
  },
  fragment: {
    invalid: 'Неверный формат паттерна фрагментации (например: 1-3, 5, random)'
  },
  noise: {
    invalid: 'Шум должен быть в hex формате (0-9, a-f, A-F)'
  }
};

// Валидация тега
export function validateTag(tag: string, existingTags: string[] = []): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!tag) {
    errors.push({ field: 'tag', message: ERROR_MESSAGES.tag.required, code: 'REQUIRED' });
    return errors;
  }
  
  if (tag.length > 32) {
    errors.push({ field: 'tag', message: ERROR_MESSAGES.tag.length, code: 'LENGTH' });
  }
  
  if (!VALIDATION_PATTERNS.tag.test(tag)) {
    errors.push({ field: 'tag', message: ERROR_MESSAGES.tag.invalid, code: 'INVALID' });
  }
  
  if (existingTags.includes(tag)) {
    errors.push({ field: 'tag', message: ERROR_MESSAGES.tag.duplicate, code: 'DUPLICATE' });
  }
  
  return errors;
}

// Валидация порта
export function validatePort(port: number | string, occupiedPorts: number[] = []): ValidationError[] {
  const errors: ValidationError[] = [];
  const portNum = typeof port === 'string' ? parseInt(port) : port;
  
  if (!port) {
    errors.push({ field: 'port', message: ERROR_MESSAGES.port.required, code: 'REQUIRED' });
    return errors;
  }
  
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    errors.push({ field: 'port', message: ERROR_MESSAGES.port.invalid, code: 'INVALID' });
    return errors;
  }
  
  // Проверка зарезервированных портов (системные)
  const reservedPorts = [22, 25, 53, 80, 110, 143, 443, 993, 995];
  if (reservedPorts.includes(portNum)) {
    errors.push({ field: 'port', message: ERROR_MESSAGES.port.reserved, code: 'RESERVED' });
  }
  
  if (occupiedPorts.includes(portNum)) {
    errors.push({ field: 'port', message: ERROR_MESSAGES.port.occupied, code: 'OCCUPIED' });
  }
  
  return errors;
}

// Валидация UUID для VMess/VLESS
export function validateUUID(uuid: string, protocol: ProtocolType): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if ((protocol === 'vmess' || protocol === 'vless') && !uuid) {
    errors.push({ field: 'uuid', message: ERROR_MESSAGES.uuid.required, code: 'REQUIRED' });
    return errors;
  }
  
  if (uuid && !VALIDATION_PATTERNS.uuid.test(uuid)) {
    errors.push({ field: 'uuid', message: ERROR_MESSAGES.uuid.invalid, code: 'INVALID' });
  }
  
  return errors;
}

// Валидация пароля для Trojan/Shadowsocks
export function validatePassword(password: string, protocol: ProtocolType): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if ((protocol === 'trojan' || protocol === 'shadowsocks') && !password) {
    errors.push({ field: 'password', message: ERROR_MESSAGES.password.required, code: 'REQUIRED' });
    return errors;
  }
  
  if (password && !VALIDATION_PATTERNS.password.test(password)) {
    errors.push({ field: 'password', message: ERROR_MESSAGES.password.invalid, code: 'INVALID' });
  }
  
  return errors;
}

// Валидация serviceName для gRPC
export function validateServiceName(serviceName: string, transport: TransportType): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (transport === 'grpc' && !serviceName) {
    errors.push({ field: 'serviceName', message: ERROR_MESSAGES.serviceName.required, code: 'REQUIRED' });
    return errors;
  }
  
  if (serviceName && !VALIDATION_PATTERNS.serviceName.test(serviceName)) {
    errors.push({ field: 'serviceName', message: ERROR_MESSAGES.serviceName.invalid, code: 'INVALID' });
  }
  
  return errors;
}

// Валидация advanced полей
export function validateAdvancedField(fieldName: string, value: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!value) return errors; // Advanced поля опциональны
  
  switch (fieldName) {
    case 'fragment':
      if (!VALIDATION_PATTERNS.fragmentPattern.test(value)) {
        errors.push({ field: fieldName, message: ERROR_MESSAGES.fragment.invalid, code: 'INVALID' });
      }
      break;
      
    case 'noise':
      if (!VALIDATION_PATTERNS.noisePattern.test(value)) {
        errors.push({ field: fieldName, message: ERROR_MESSAGES.noise.invalid, code: 'INVALID' });
      }
      break;
      
    case 'path':
      if (!VALIDATION_PATTERNS.path.test(value)) {
        errors.push({ field: fieldName, message: ERROR_MESSAGES.path.invalid, code: 'INVALID' });
      }
      break;
      
    case 'host':
      if (!VALIDATION_PATTERNS.host.test(value)) {
        errors.push({ field: fieldName, message: ERROR_MESSAGES.host.invalid, code: 'INVALID' });
      }
      break;
  }
  
  return errors;
}

// Основная функция валидации формы
export function validateInboundForm(
  formData: InboundFormData,
  existingTags: string[] = [],
  occupiedPorts: number[] = []
): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  // Валидация обязательных полей
  allErrors.push(...validateTag(formData.tag, existingTags));
  allErrors.push(...validatePort(formData.port, occupiedPorts));
  
  // Валидация в зависимости от шаблона (будет расширена после создания шаблонов)
  // Пока базовая валидация
  
  // Валидация advanced полей
  if (formData.advancedValues) {
    Object.entries(formData.advancedValues).forEach(([field, value]) => {
      if (typeof value === 'string' && value.trim()) {
        allErrors.push(...validateAdvancedField(field, value.trim()));
      }
    });
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: [] // Пока без предупреждений
  };
}

// Валидация готового конфига инбаунда
export function validateInboundConfig(config: InboundConfig): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  // Базовая валидация структуры
  if (!config.tag) {
    allErrors.push({ field: 'tag', message: ERROR_MESSAGES.tag.required, code: 'REQUIRED' });
  }
  
  if (!config.port) {
    allErrors.push({ field: 'port', message: ERROR_MESSAGES.port.required, code: 'REQUIRED' });
  }
  
  if (!config.protocol) {
    allErrors.push({ field: 'protocol', message: 'Протокол обязателен', code: 'REQUIRED' });
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// Экспорт утилит для проверки
export const ValidationUtils = {
  isValidTag: (tag: string) => VALIDATION_PATTERNS.tag.test(tag),
  isValidPort: (port: number) => port >= 1 && port <= 65535,
  isValidUUID: (uuid: string) => VALIDATION_PATTERNS.uuid.test(uuid),
  isValidPassword: (password: string) => VALIDATION_PATTERNS.password.test(password),
  isValidServiceName: (name: string) => VALIDATION_PATTERNS.serviceName.test(name),
  isValidPath: (path: string) => VALIDATION_PATTERNS.path.test(path),
  isValidHost: (host: string) => VALIDATION_PATTERNS.host.test(host)
};
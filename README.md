<div align="center">
  <img src="dashboard/src/assets/icon.png" alt="WildosVPN Logo" width="120" height="120">
  
  # WildosVPN
  
  > **✅ Стабильная версия v0.5.0**  
  > **Полная автоматизация, SSL сертификаты и производственная готовность**
</div>

> **Русский** | [English](#english)

WildosVPN — это стабильная, готовая к продакшену панель управления прокси-серверами с полной автоматизацией, SSL сертификатами и современными протоколами.

## ⚡ Быстрый старт

### Автоматическая установка (рекомендуется)
```bash
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/install.sh)"
```

**Что включает установка:**
- ✅ Панель управления с веб-интерфейсом
- ✅ Автоматическая настройка Docker окружения  
- ✅ Генерация SSL сертификатов и токенов безопасности
- ✅ Настройка Caddy реверс-прокси с автоматическим SSL
- ✅ Создание административного аккаунта
- ✅ Автоматический запуск всех сервисов
- ✅ Встроенная система автообновлений
- ✅ Мониторинг системы и автоочистка

> 📋 **Интерактивная установка**: скрипт запросит домен панели, домен подписок и данные администратора

## 🚀 Возможности v0.5.0

### 🔧 Протоколы и технологии
- **Xray Core**: VLESS, VMess, Trojan, Shadowsocks с полной поддержкой Reality
- **Sing-box**: современный универсальный прокси с оптимизациями
- **Hysteria2**: высокоскоростной протокол на базе QUIC
- **WireGuard**: VPN протокол с автоматической конфигурацией

### 🤖 Полная автоматизация
- **SSL сертификаты**: автоматическая генерация, обновление и управление
- **Docker**: полная контейнеризация с оркестрацией
- **Мониторинг ресурсов**: автоматическое отслеживание дискового пространства, CPU, RAM
- **Обслуживание системы**: автоматическая очистка логов, оптимизация базы данных
- **Обновления**: безопасные обновления с автоматическим откатом при сбоях
- **Резервное копирование**: ежедневные автобэкапы с проверкой целостности

### 🎨 Современный интерфейс
- **React 18**: современный веб-интерфейс с TypeScript
- **Адаптивный дизайн**: работает на всех устройствах
- **Многоязычность**: русский и английский языки
- **Темная тема**: удобная работа в любое время
- **API**: полный RESTful API для автоматизации

### 🔒 Производственная безопасность
- **SSL/TLS everywhere**: шифрование всех соединений
- **Токенная аутентификация**: защищенные API ключи для нод
- **Мониторинг безопасности**: отслеживание подозрительной активности
- **Файрвол**: автоматическая настройка iptables/ufw
- **Аудит**: логирование всех операций администрирования

## 🎯 Архитектура v0.5.0

WildosVPN использует производственную модульную архитектуру:

| Компонент | Описание | Технологии |
|-----------|----------|------------|
| **Dashboard** | React 18 веб-интерфейс | TypeScript, Tailwind CSS, TanStack |
| **API Backend** | RESTful API сервер | FastAPI, SQLAlchemy, Pydantic |
| **WildosNode** | Прокси-сервер с gRPC | Python, Xray, Sing-box, Hysteria2 |
| **SSL Manager** | Автоматическое управление сертификатами | OpenSSL, Let's Encrypt |
| **Reverse Proxy** | SSL терминация и маршрутизация | Caddy 2 |
| **Database** | Реляционная база данных | SQLite / PostgreSQL |

### Скрипты установки и управления

| Скрипт | Назначение | Особенности |
|--------|------------|-------------|
| **install.sh** | Установка панели управления | Панель + Caddy + автообновление |
| **node.sh** | Установка ноды | Автономная нода + автообновление |

## 📊 Автоматизация и мониторинг v0.5.0

### 🤖 Полная автоматизация
WildosVPN v0.5.0 работает без вмешательства администратора:

- **SSL сертификаты**: автоматическая генерация, обновление и мониторинг
- **Мониторинг ресурсов**: постоянное отслеживание дискового пространства, CPU, RAM
- **Очистка системы**: автоматическое удаление старых логов и временных файлов
- **Обслуживание базы данных**: оптимизация и очистка устаревших записей
- **Health checks**: проверка состояния всех компонентов каждые 5 минут
- **Автоматический restart**: перезапуск неработающих сервисов

### 🔍 Система мониторинга
- **Дисковое пространство**: предупреждения при заполнении более 80%
- **Производительность**: отслеживание нагрузки на CPU и RAM
- **Статус нод**: автоматическая проверка доступности всех серверов
- **SSL сертификаты**: мониторинг сроков действия с автообновлением
- **Логирование**: структурированные логи с ротацией

### CLI команды системы
```bash
wildosvpn status          # Статус всех компонентов
wildosvpn health          # Детальная проверка системы
wildosvpn logs            # Просмотр логов всех сервисов
wildosvpn cert-status     # Статус SSL сертификатов
```

## 🔒 Безопасность v0.5.0

### 🛡️ Автоматическая безопасность
WildosVPN v0.5.0 обеспечивает максимальную безопасность без настройки:

- **SSL сертификаты**: автоматическая генерация для всех компонентов
- **Шифрование связи**: все соединения защищены TLS 1.3
- **Токенная аутентификация**: защищенные JWT токены для API и нод
- **Файрвол**: автоматическая настройка iptables с минимальными портами
- **Мониторинг безопасности**: отслеживание подозрительной активности
- **Аудит операций**: полное логирование административных действий

### 🔐 Управление сертификатами
- **Автогенерация**: создание сертификатов для панели и всех нод
- **Автообновление**: обновление сертификатов за 30 дней до истечения
- **Валидация**: постоянная проверка корректности сертификатов
- **Резервное копирование**: автоматическое сохранение ключей

### CLI команды безопасности
```bash
wildosvpn cert-status        # Статус всех сертификатов
wildosvpn security-audit     # Аудит безопасности системы
wildosvpn generate-certs     # Перегенерация сертификатов
```

## 📋 Управление

### Основные команды системы
```bash
wildosvpn start         # Запуск всех сервисов
wildosvpn stop          # Остановка всех сервисов  
wildosvpn restart       # Перезапуск системы
wildosvpn status        # Статус контейнеров
wildosvpn logs          # Просмотр логов
wildosvpn update        # Обновление системы
```

### Управление нодой
```bash
wildosnode status       # Статус ноды
wildosnode logs         # Логи ноды
wildosnode restart      # Перезапуск ноды
wildosnode stop         # Остановка ноды
```

### Резервное копирование
```bash
# Создание backup'а
wildosvpn backup

# Просмотр существующих backup'ов  
ls /var/backups/wildosvpn/

# Восстановление из backup'а
wildosvpn restore /path/to/backup
```

## 🔧 Требования

- **ОС**: Ubuntu 20.04+, Debian 11+, CentOS 8+
- **RAM**: 1GB минимум
- **Диск**: 5GB свободного места
- **Docker**: Устанавливается автоматически

## 📖 После установки

1. **Панель**: `https://ваш-домен.com`
2. **Логин**: `admin` (по умолчанию)
3. **Пароль**: задается при установке

## 🛠 Автоматические обновления

WildosVPN v0.5.0 включает встроенную систему автообновлений:

### Автоматические обновления
- **Панель**: автоматические обновления встроены в `install.sh`
- **Нода**: автоматические обновления встроены в `node.sh`
- **Периодичность**: проверка обновлений каждые 24 часа
- **Безопасность**: автоматический откат при сбоях

### Ручное обновление
```bash
# Переустановка панели с обновлением
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/install.sh)"

# Переустановка ноды с обновлением
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/node.sh)"
```

## 🔧 Установка отдельной ноды

Для установки только ноды без панели управления используйте `node.sh`:

### Быстрая установка ноды
```bash
# Скачать и запустить скрипт установки ноды
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/node.sh)"
```

### Возможности node.sh (v0.3.0)
- **Автономная установка**: настройка ноды без зависимости от панели
- **Интерактивная конфигурация**: запрос всех необходимых параметров
- **Множественные протоколы**: поддержка Xray, Sing-box, Hysteria
- **Улучшенное управление сертификатами**: автоматическая генерация, обновление и мониторинг SSL
- **Systemd сервис**: автоматический запуск при старте системы
- **Мониторинг подключения**: улучшенное отслеживание связи с панелью
- **Производственная готовность**: встроенная безопасность и логирование

### Команды управления нодой
```bash
# Установка ноды
node.sh install

# Удаление ноды
node.sh uninstall

# Обновление ноды
node.sh update

# Проверка статуса
node.sh status

# Справка
node.sh help
```

### Конфигурация ноды
При установке скрипт запросит:
- **Порт gRPC**: для связи с панелью (по умолчанию 62050)
- **IP панели**: адрес основной панели управления
- **Протоколы**: какие протоколы включить (Xray/Sing-box/Hysteria)

### CLI команды ноды
После установки доступны команды:
```bash
wildosnode status       # Статус ноды и всех сервисов
wildosnode logs         # Просмотр логов
wildosnode restart      # Перезапуск ноды
wildosnode stop         # Остановка ноды
wildosnode start        # Запуск ноды
```

### Что сохраняется при обновлении
- ✅ **Пользовательские данные**: аккаунты, подписки, статистика
- ✅ **Конфигурации**: настройки панели и нод  
- ✅ **SSL сертификаты**: для связи между компонентами
- ✅ **База данных**: полная история операций
- ✅ **Кастомные шаблоны**: пользовательские настройки интерфейса

### Автоматический откат
Система автоматически откатится к предыдущей версии в случае:
- Ошибок при запуске обновленных сервисов
- Критических ошибок в логах
- Недоступности API после обновления

## 💡 Поддержка

- **Issues**: [GitHub Issues](https://github.com/wildos-dev/WildosVPN/issues)
- **Документация**: [Wiki](https://github.com/wildos-dev/WildosVPN/wiki)

---

## English

<div align="center">
  
  > **✅ Stable Release v0.5.0**  
  > **Production-ready with full automation and SSL certificates**
  
</div>

WildosVPN is a stable, production-ready proxy management panel with complete automation, SSL certificates, and modern protocols.

## ⚡ Quick Start

### Automated Installation (Recommended)
```bash
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/install.sh)"
```

**Installation includes:**
- ✅ Management panel with web interface
- ✅ Automatic Docker environment configuration
- ✅ SSL certificate generation and management
- ✅ Caddy reverse proxy with automatic SSL
- ✅ Administrative account creation
- ✅ Built-in auto-update system

> 📋 **Interactive installation**: script will prompt for panel domain, subscription domain, and admin credentials

## 🚀 Features v0.5.0

### 🔧 Protocols and Technologies
- **Xray Core**: VLESS, VMess, Trojan, Shadowsocks with full Reality support
- **Sing-box**: modern universal proxy with optimizations
- **Hysteria2**: high-speed QUIC-based protocol
- **WireGuard**: VPN protocol with automatic configuration

### 🤖 Complete Automation
- **SSL certificates**: automatic generation, renewal, and management
- **Docker**: full containerization with orchestration
- **Resource monitoring**: automatic disk space, CPU, RAM tracking
- **System maintenance**: automatic log cleanup, database optimization
- **Updates**: safe updates with automatic rollback on failure
- **Backups**: daily automated backups with integrity checks

### 🎨 Modern Interface
- **React 18**: modern web interface with TypeScript
- **Responsive design**: works on all devices
- **Multi-language**: Russian and English support
- **Dark theme**: comfortable work at any time
- **API**: complete RESTful API for automation

### 🔒 Production Security
- **SSL/TLS everywhere**: encryption for all connections
- **Token authentication**: secure API keys for nodes
- **Security monitoring**: tracking suspicious activity
- **Firewall**: automatic iptables/ufw configuration
- **Audit logging**: logging all administrative operations

## 🎯 Architecture v0.5.0

WildosVPN uses production-grade modular architecture:

| Component | Description | Technologies |
|-----------|-------------|--------------|
| **Dashboard** | React 18 web interface | TypeScript, Tailwind CSS, TanStack |
| **API Backend** | RESTful API server | FastAPI, SQLAlchemy, Pydantic |
| **WildosNode** | Proxy server with gRPC | Python, Xray, Sing-box, Hysteria2 |
| **SSL Manager** | Automatic certificate management | OpenSSL, Let's Encrypt |
| **Reverse Proxy** | SSL termination and routing | Caddy 2 |
| **Database** | Relational database | SQLite / PostgreSQL |

### Installation and Management Scripts

| Script | Purpose | Features |
|--------|---------|----------|
| **install.sh** | Management panel installation | Panel + Caddy + auto-updates |
| **node.sh** | Node installation | Standalone node + auto-updates |

## 📋 Management

### Main system commands
```bash
wildosvpn start         # Start all services
wildosvpn stop          # Stop all services
wildosvpn restart       # Restart system
wildosvpn status        # Container status
wildosvpn logs          # View logs
wildosvpn update        # Update system
```

### Node management
```bash
wildosnode status       # Node status
wildosnode logs         # Node logs
wildosnode restart      # Restart node
wildosnode stop         # Stop node
```

### Backup management
```bash
# Create backup
wildosvpn backup

# View existing backups
ls /var/backups/wildosvpn/

# Restore from backup
wildosvpn restore /path/to/backup
```

## 🔧 Requirements

- **OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+
- **RAM**: 1GB minimum
- **Disk**: 5GB free space
- **Docker**: Installed automatically

## 📖 After Installation

1. **Panel**: `https://your-domain.com`
2. **Login**: `admin` (default)
3. **Password**: set during installation

## 🛠 Automatic Updates

WildosVPN v0.5.0 includes built-in auto-update system:

### Automatic Updates
- **Panel**: auto-updates built into `install.sh`
- **Node**: auto-updates built into `node.sh`
- **Frequency**: update check every 24 hours
- **Safety**: automatic rollback on failures

### Manual Update
```bash
# Reinstall panel with updates
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/install.sh)"

# Reinstall node with updates
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/node.sh)"
```

## 🔧 Standalone Node Installation

For installing only a node without the management panel, use `node.sh`:

### Quick node installation
```bash
# Download and run node installation script
bash -c "$(curl -sSL https://github.com/wildos-dev/WildosVPN/raw/main/node.sh)"
```

### node.sh Features
- **Standalone installation**: node setup without panel dependency
- **Interactive configuration**: prompts for all necessary parameters
- **Multiple protocols**: Xray, Sing-box, Hysteria support
- **SSL certificates**: automatic generation for secure communication
- **Systemd service**: automatic startup on system boot

### Node management commands
```bash
# Install node
node.sh install

# Uninstall node
node.sh uninstall

# Update node
node.sh update

# Check status
node.sh status

# Help
node.sh help
```

### Node configuration
During installation, the script will ask for:
- **gRPC port**: for panel communication (default 62050)
- **Panel IP**: main management panel address
- **Protocols**: which protocols to enable (Xray/Sing-box/Hysteria)

### Node CLI commands
After installation, available commands:
```bash
wildosnode status       # Node and all services status
wildosnode logs         # View logs
wildosnode restart      # Restart node
wildosnode stop         # Stop node
wildosnode start        # Start node
```

### What's preserved during updates
- ✅ **User data**: accounts, subscriptions, statistics
- ✅ **Configurations**: panel and node settings
- ✅ **SSL certificates**: for inter-component communication
- ✅ **Database**: complete operation history
- ✅ **Custom templates**: user interface customizations

### Automatic rollback
System automatically rolls back to previous version in case of:
- Errors when starting updated services
- Critical errors in logs
- API unavailability after update

## 💡 Support

- **Issues**: [GitHub Issues](https://github.com/wildos-dev/WildosVPN/issues)
- **Documentation**: [Wiki](https://github.com/wildos-dev/WildosVPN/wiki)

---

## 🎉 Что нового в v0.5.0

### ✅ Стабильность
- **Производственная готовность**: протестировано в продакшн среде
- **Автоматическое восстановление**: самолечащиеся сервисы
- **Отказоустойчивость**: автоматический откат при сбоях

### 🔐 Автоматические SSL сертификаты
- **Генерация**: создание сертификатов для всех компонентов
- **Мониторинг**: отслеживание сроков действия
- **Обновление**: автоматическое продление за 30 дней

### 🤖 Полная автоматизация
- **Мониторинг ресурсов**: CPU, RAM, дисковое пространство
- **Обслуживание**: очистка логов, оптимизация БД
- **Резервное копирование**: ежедневные бэкапы

### 🎨 Современный интерфейс
- **React 18**: быстрый и отзывчивый интерфейс
- **TypeScript**: типизированный код для надежности
- **Адаптивный дизайн**: работает на всех устройствах

---

## License

MIT License - see [LICENSE](LICENSE) file for details.
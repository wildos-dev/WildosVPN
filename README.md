# WildosVPN

*Choose your language / Выберите язык:*
- [🇺🇸 English](#english)
- [🇷🇺 Русский](#русский)

---

## English

### Overview
WildosVPN is a powerful VPN management panel for Xray-core with SSL support via Caddy.

### Features
- 🚀 **Easy Installation** - Interactive scripts for quick setup
- 🔒 **SSL by Default** - Automatic HTTPS with Caddy reverse proxy
- 🎨 **Visual Inbound Wizard** - Intuitive configuration interface
- 💾 **Backup System** - Automated backups via Telegram
- 🔄 **Update System** - Flexible update options (Git/Local)
- 🗃️ **Database Support** - SQLite and MySQL compatibility
- 🤖 **Telegram Bot** - Notifications and management
- 🌐 **Multi-Platform** - Ubuntu, Debian, CentOS, Fedora, Arch

### Quick Installation

#### From Git Repository (Recommended)
```bash
# Download and run installer
sudo bash -c "$(curl -sL https://raw.githubusercontent.com/wildos-dev/WildosVPN/main/wildosvpn.sh)"
```

#### Local Installation
```bash
# Clone repository
git clone https://github.com/wildos-dev/WildosVPN.git
cd WildosVPN

# Run installer
sudo bash wildosvpn.sh install
```

### Management Commands
```bash
wildosvpn start        # Start services
wildosvpn stop         # Stop services  
wildosvpn restart      # Restart services
wildosvpn status       # Show services status
wildosvpn logs         # View logs
wildosvpn backup       # Create backup
wildosvpn update       # Update WildosVPN
wildosvpn admin        # Admin management
wildosvpn uninstall    # Uninstall WildosVPN
wildosvpn script-update # Update management script
```

### Update System
```bash
# Update WildosVPN
wildosvpn update

# Update management script
wildosvpn script-update
```

### Uninstall
```bash
# Complete removal with backup option
wildosvpn uninstall
```

### Requirements
- **OS**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **RAM**: 512MB minimum, 1GB recommended
- **Storage**: 10GB free space
- **Ports**: 80, 443 (for SSL)
- **Domain**: Required for SSL certificates

### Support
- Repository: [wildos-dev/WildosVPN](https://github.com/wildos-dev/WildosVPN)
- Issues: [GitHub Issues](https://github.com/wildos-dev/WildosVPN/issues)

---

## Русский

### Описание
WildosVPN - это мощная панель управления VPN для Xray-core с поддержкой SSL через Caddy.

### Возможности
- 🚀 **Простая установка** - Интерактивные скрипты для быстрой настройки
- 🔒 **SSL по умолчанию** - Автоматический HTTPS с Caddy reverse proxy
- 🎨 **Визуальный мастер** - Интуитивный интерфейс конфигурации
- 💾 **Система резервных копий** - Автоматические бэкапы через Telegram
- 🔄 **Система обновлений** - Гибкие варианты обновления (Git/Локально)
- 🗃️ **Поддержка БД** - Совместимость с SQLite и MySQL
- 🤖 **Telegram бот** - Уведомления и управление
- 🌐 **Мультиплатформенность** - Ubuntu, Debian, CentOS, Fedora, Arch

### Быстрая установка

#### С Git репозитория (Рекомендуется)
```bash
# Скачать и запустить установщик
sudo bash -c "$(curl -sL https://raw.githubusercontent.com/wildos-dev/WildosVPN/main/wildosvpn.sh)"
```

#### Локальная установка
```bash
# Клонировать репозиторий
git clone https://github.com/wildos-dev/WildosVPN.git
cd WildosVPN

# Запустить установщик
sudo bash wildosvpn.sh install
```

### Команды управления
```bash
wildosvpn start        # Запуск сервисов
wildosvpn stop         # Остановка сервисов
wildosvpn restart      # Перезапуск сервисов
wildosvpn status       # Статус сервисов
wildosvpn logs         # Просмотр логов
wildosvpn backup       # Создание резервной копии
wildosvpn update       # Обновление WildosVPN
wildosvpn admin        # Управление администраторами
wildosvpn uninstall    # Удаление WildosVPN
wildosvpn script-update # Обновление скрипта управления
```

### Система обновлений
```bash
# Обновление WildosVPN
wildosvpn update

# Обновление скрипта управления
wildosvpn script-update
```

### Удаление
```bash
# Полное удаление с возможностью резервного копирования
wildosvpn uninstall
```

### Требования
- **ОС**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **RAM**: 512MB минимум, 1GB рекомендуется
- **Хранилище**: 10GB свободного места
- **Порты**: 80, 443 (для SSL)
- **Домен**: Необходим для SSL сертификатов

### Поддержка
- Репозиторий: [wildos-dev/WildosVPN](https://github.com/wildos-dev/WildosVPN)
- Проблемы: [GitHub Issues](https://github.com/wildos-dev/WildosVPN/issues)

---

### Default Credentials / Данные по умолчанию
- **Username/Пользователь**: `admin`
- **Password/Пароль**: `admin`

> ⚠️ **Important/Важно**: Change default credentials after first login / Смените пароль после первого входа!

### License / Лицензия
This project is licensed under AGPL v3.0.
Этот проект лицензирован под AGPL v3.0.
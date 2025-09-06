#!/usr/bin/env bash
set -e

# Интерактивный скрипт установки WildosVPN с Git репозитория
# Поддерживает полную настройку SSL с Caddy, администратора и всех параметров
# Использует только репозиторий wildos-dev/WildosVPN

INSTALL_DIR="/opt"
if [ -z "$APP_NAME" ]; then
    APP_NAME="wildosvpn"
fi
APP_DIR="$INSTALL_DIR/$APP_NAME"
DATA_DIR="/var/lib/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
ENV_FILE="$APP_DIR/.env"

# Переменные конфигурации
WILDOSVPN_REPO="wildos-dev/WildosVPN"
SUDO_USERNAME="admin"
SUDO_PASSWORD=""
PANEL_DOMAIN=""
SUBSCRIPTION_DOMAIN=""
ENABLE_BACKUP_SERVICE=false
USE_CUSTOM_ADMIN=false
USE_MYSQL=false
USE_TELEGRAM_BOT=false
SKIP_FRONTEND_BUILD=false

# Цветной вывод
colorized_echo() {
    local color=$1
    local text=$2

    case $color in
        "red")
        printf "\e[91m${text}\e[0m\n";;
        "green")
        printf "\e[92m${text}\e[0m\n";;
        "yellow")
        printf "\e[93m${text}\e[0m\n";;
        "blue")
        printf "\e[94m${text}\e[0m\n";;
        "magenta")
        printf "\e[95m${text}\e[0m\n";;
        "cyan")
        printf "\e[96m${text}\e[0m\n";;
        *)
            echo "${text}"
        ;;
    esac
}

# Логирование действий
log_action() {
    local message="$1"
    local log_file="$APP_DIR/install.log"
    # Создаем директорию если она не существует
    mkdir -p "$(dirname "$log_file")" 2>/dev/null || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" >> "$log_file"
    colorized_echo blue "$message"
}

# Проверка системных требований
check_system_requirements() {
    colorized_echo blue "Проверка системных требований"
    
    # Проверка RAM (минимум 512MB)
    if command -v free >/dev/null 2>&1; then
        RAM_MB=$(free -m | awk 'NR==2{print $2}')
        if [ "$RAM_MB" -lt 512 ]; then
            colorized_echo yellow "Предупреждение: Недостаточно RAM ($RAM_MB MB < 512 MB)"
        else
            log_action "RAM проверена: $RAM_MB MB"
        fi
    fi
    
    # Проверка свободного места (минимум 2GB)
    if command -v df >/dev/null 2>&1; then
        DISK_GB=$(df / | awk 'NR==2{print int($4/1024/1024)}')
        if [ "$DISK_GB" -lt 2 ]; then
            colorized_echo red "Ошибка: Недостаточно места на диске ($DISK_GB GB < 2 GB)"
            exit 1
        else
            log_action "Свободное место проверено: $DISK_GB GB"
        fi
    fi
    
    colorized_echo green "Системные требования выполнены"
}

# Проверка доступности портов
check_ports() {
    colorized_echo blue "Проверка доступности портов"
    
    for port in 80 443; do
        if command -v netstat >/dev/null 2>&1; then
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                colorized_echo yellow "Порт $port уже используется"
            else
                log_action "Порт $port доступен"
            fi
        elif command -v ss >/dev/null 2>&1; then
            if ss -tuln 2>/dev/null | grep -q ":$port "; then
                colorized_echo yellow "Порт $port уже используется"
            else
                log_action "Порт $port доступен"
            fi
        fi
    done
}

check_running_as_root() {
    if [ "$(id -u)" != "0" ]; then
        colorized_echo red "Этот скрипт должен запускаться от имени root."
        exit 1
    fi
}

detect_os() {
    # Определение операционной системы
    if [ -f /etc/lsb-release ]; then
        OS=$(lsb_release -si)
    elif [ -f /etc/os-release ]; then
        OS=$(awk -F= '/^NAME/{print $2}' /etc/os-release | tr -d '"')
    elif [ -f /etc/redhat-release ]; then
        OS=$(cat /etc/redhat-release | awk '{print $1}')
    elif [ -f /etc/arch-release ]; then
        OS="Arch"
    else
        colorized_echo red "Неподдерживаемая операционная система"
        exit 1
    fi
}

detect_and_update_package_manager() {
    colorized_echo blue "Обновление менеджера пакетов"
    if [[ "$OS" == "Ubuntu"* ]] || [[ "$OS" == "Debian"* ]]; then
        PKG_MANAGER="apt-get"
        $PKG_MANAGER update
    elif [[ "$OS" == "CentOS"* ]] || [[ "$OS" == "AlmaLinux"* ]]; then
        PKG_MANAGER="yum"
        $PKG_MANAGER update -y
        $PKG_MANAGER install -y epel-release
    elif [ "$OS" == "Fedora"* ]; then
        PKG_MANAGER="dnf"
        $PKG_MANAGER update
    elif [ "$OS" == "Arch" ]; then
        PKG_MANAGER="pacman"
        $PKG_MANAGER -Sy
    elif [[ "$OS" == "openSUSE"* ]]; then
        PKG_MANAGER="zypper"
        $PKG_MANAGER refresh
    else
        colorized_echo red "Неподдерживаемая операционная система"
        exit 1
    fi
}

install_package () {
    if [ -z $PKG_MANAGER ]; then
        detect_and_update_package_manager
    fi

    PACKAGE=$1
    colorized_echo blue "Установка $PACKAGE"
    if [[ "$OS" == "Ubuntu"* ]] || [[ "$OS" == "Debian"* ]]; then
        $PKG_MANAGER -y install "$PACKAGE"
    elif [[ "$OS" == "CentOS"* ]] || [[ "$OS" == "AlmaLinux"* ]]; then
        $PKG_MANAGER install -y "$PACKAGE"
    elif [ "$OS" == "Fedora"* ]; then
        $PKG_MANAGER install -y "$PACKAGE"
    elif [ "$OS" == "Arch" ]; then
        $PKG_MANAGER -S --noconfirm "$PACKAGE"
    else
        colorized_echo red "Неподдерживаемая операционная система"
        exit 1
    fi
}

install_docker() {
    # Установка Docker и Docker Compose с помощью официального скрипта
    colorized_echo blue "Установка Docker"
    curl -fsSL https://get.docker.com | sh
    colorized_echo green "Docker успешно установлен"
}

detect_compose() {
    # Проверка наличия команды docker compose
    if docker compose version >/dev/null 2>&1; then
        COMPOSE='docker compose'
    elif docker-compose version >/dev/null 2>&1; then
        COMPOSE='docker-compose'
    else
        colorized_echo red "docker compose не найден"
        exit 1
    fi
}

install_wildosvpn_script() {
    FETCH_REPO="wildos-dev/WildosVPN"
    SCRIPT_URL="https://github.com/$FETCH_REPO/raw/main/wildosvpn.sh"
    colorized_echo blue "Установка скрипта wildosvpn"
    curl -sSL $SCRIPT_URL | install -m 755 /dev/stdin /usr/local/bin/wildosvpn
    colorized_echo green "Скрипт wildosvpn успешно установлен"
}

# Настройка администратора
setup_admin() {
    colorized_echo blue "=============================================="
    colorized_echo blue "         Настройка администратора              "
    colorized_echo blue "=============================================="
    
    colorized_echo cyan "Хотите настроить собственные данные администратора? (y/n) [по умолчанию: n]"
    read -p "Ответ: " setup_admin_choice
    
    if [[ "$setup_admin_choice" =~ ^[Yy]$ ]]; then
        USE_CUSTOM_ADMIN=true
        
        while true; do
            read -p "Введите имя пользователя администратора [admin]: " input_username
            SUDO_USERNAME="${input_username:-admin}"
            
            if [[ "$SUDO_USERNAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
                break
            else
                colorized_echo red "Имя пользователя должно содержать только буквы, цифры и подчеркивания"
            fi
        done
        
        while true; do
            read -s -p "Введите пароль администратора (минимум 8 символов): " SUDO_PASSWORD
            echo
            if [[ ${#SUDO_PASSWORD} -ge 8 ]]; then
                read -s -p "Подтвердите пароль: " password_confirm
                echo
                if [[ "$SUDO_PASSWORD" == "$password_confirm" ]]; then
                    break
                else
                    colorized_echo red "Пароли не совпадают. Попробуйте снова."
                fi
            else
                colorized_echo red "Пароль должен содержать минимум 8 символов"
            fi
        done
        
        colorized_echo green "Администратор настроен: $SUDO_USERNAME"
    else
        SUDO_USERNAME="admin"
        SUDO_PASSWORD="admin"
        colorized_echo yellow "Используются данные по умолчанию: admin/admin"
        colorized_echo yellow "ВАЖНО: Обязательно смените пароль после первого входа!"
    fi
}

# Интерактивная настройка домена
setup_domain() {
    colorized_echo blue "=============================================="
    colorized_echo blue "      Настройка домена для SSL с Caddy       "
    colorized_echo blue "=============================================="
    
    while true; do
        echo ""
        colorized_echo cyan "Введите ваш домен для панели управления (например: panel.example.com):"
        read -p "Домен панели: " PANEL_DOMAIN
        
        if [[ -n "$PANEL_DOMAIN" ]]; then
            # Простая валидация домена
            if [[ "$PANEL_DOMAIN" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                break
            else
                colorized_echo red "Неверный формат домена. Попробуйте снова."
            fi
        else
            colorized_echo red "Домен не может быть пустым. Попробуйте снова."
        fi
    done
    
    echo ""
    colorized_echo cyan "Хотите использовать отдельный домен для подписок? (y/n) [по умолчанию: n]"
    read -p "Ответ: " USE_SEPARATE_SUB_DOMAIN
    
    if [[ "$USE_SEPARATE_SUB_DOMAIN" =~ ^[Yy]$ ]]; then
        while true; do
            echo ""
            colorized_echo cyan "Введите домен для подписок (например: sub.example.com):"
            read -p "Домен подписок: " SUBSCRIPTION_DOMAIN
            
            if [[ -n "$SUBSCRIPTION_DOMAIN" ]]; then
                if [[ "$SUBSCRIPTION_DOMAIN" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                    break
                else
                    colorized_echo red "Неверный формат домена. Попробуйте снова."
                fi
            else
                colorized_echo red "Домен подписок не может быть пустым. Попробуйте снова."
            fi
        done
    else
        SUBSCRIPTION_DOMAIN="$PANEL_DOMAIN"
    fi
    
    colorized_echo green "=============================================="
    colorized_echo green "Конфигурация доменов:"
    colorized_echo green "Панель управления: https://$PANEL_DOMAIN"
    colorized_echo green "Подписки: https://$SUBSCRIPTION_DOMAIN"
    colorized_echo green "=============================================="
    
    # Проверяем доступность портов после настройки домена
    check_ports
}

# Дополнительные настройки
setup_additional_options() {
    colorized_echo blue "=============================================="
    colorized_echo blue "        Дополнительные настройки             "
    colorized_echo blue "=============================================="
    
    echo "Выберите дополнительные опции (y/n):"
    
    echo ""
    read -p "Выполнить сборку фронтенда? (y/n) [по умолчанию: y]: " build_frontend_choice
    if [[ "$build_frontend_choice" =~ ^[Nn]$ ]]; then
        SKIP_FRONTEND_BUILD=true
        colorized_echo yellow "Сборка фронтенда будет пропущена"
    else
        SKIP_FRONTEND_BUILD=false
        colorized_echo green "Фронтенд будет собран автоматически"
    fi
    
    echo ""
    read -p "Настроить автоматические резервные копии через Telegram? (y/n): " backup_choice
    if [[ "$backup_choice" =~ ^[Yy]$ ]]; then
        ENABLE_BACKUP_SERVICE=true
        setup_backup_service
    fi
    
    echo ""
    read -p "Использовать MySQL вместо SQLite? (y/n): " mysql_choice
    if [[ "$mysql_choice" =~ ^[Yy]$ ]]; then
        USE_MYSQL=true
        setup_mysql
    fi
    
    echo ""
    read -p "Настроить Telegram бота для уведомлений? (y/n): " telegram_choice
    if [[ "$telegram_choice" =~ ^[Yy]$ ]]; then
        USE_TELEGRAM_BOT=true
        setup_telegram_bot
    fi
}

# Настройка службы резервного копирования
setup_backup_service() {
    colorized_echo blue "Настройка службы резервного копирования"
    
    while true; do
        read -p "Введите Telegram Bot API ключ: " BACKUP_TELEGRAM_BOT_KEY
        if [[ -n "$BACKUP_TELEGRAM_BOT_KEY" ]]; then
            break
        else
            colorized_echo red "API ключ не может быть пустым"
        fi
    done
    
    while true; do
        read -p "Введите Telegram Chat ID: " BACKUP_TELEGRAM_CHAT_ID
        if [[ -n "$BACKUP_TELEGRAM_CHAT_ID" ]]; then
            break
        else
            colorized_echo red "Chat ID не может быть пустым"
        fi
    done
    
    echo "Выберите интервал резервного копирования конфигурации:"
    echo "1. Каждые 6 часов"
    echo "2. Каждые 12 часов"
    echo "3. Ежедневно"
    echo "4. Еженедельно"
    
    while true; do
        read -p "Введите номер (1-4): " interval_choice
        case $interval_choice in
            1) BACKUP_CRON_SCHEDULE="0 */6 * * *"; break;;
            2) BACKUP_CRON_SCHEDULE="0 */12 * * *"; break;;
            3) BACKUP_CRON_SCHEDULE="0 0 * * *"; break;;
            4) BACKUP_CRON_SCHEDULE="0 0 * * 0"; break;;
            *) colorized_echo red "Неверный выбор";;
        esac
    done
    
    # Настройка cron задачи для автоматического бекапа конфигов
    setup_config_backup_cron
    
    colorized_echo green "Служба резервного копирования настроена"
}

# Настройка cron задачи для автоматического бекапа конфигов
setup_config_backup_cron() {
    if [ -z "$BACKUP_CRON_SCHEDULE" ]; then
        return
    fi
    
    colorized_echo blue "Настройка автоматического бекапа конфигурации"
    
    # Удаление старых cron задач WildosVPN
    crontab -l 2>/dev/null | grep -v "wildosvpn backup-config" | crontab - 2>/dev/null || true
    
    # Добавление новой cron задачи
    (crontab -l 2>/dev/null; echo "$BACKUP_CRON_SCHEDULE /usr/local/bin/wildosvpn backup-config >/dev/null 2>&1") | crontab -
    
    colorized_echo green "Автоматический бекап конфигурации настроен с расписанием: $BACKUP_CRON_SCHEDULE"
}

# Настройка MySQL
setup_mysql() {
    colorized_echo blue "Настройка MySQL"
    
    read -p "Введите хост MySQL [localhost]: " MYSQL_HOST
    MYSQL_HOST="${MYSQL_HOST:-localhost}"
    
    read -p "Введите порт MySQL [3306]: " MYSQL_PORT
    MYSQL_PORT="${MYSQL_PORT:-3306}"
    
    read -p "Введите имя базы данных [wildosvpn]: " MYSQL_DB
    MYSQL_DB="${MYSQL_DB:-wildosvpn}"
    
    read -p "Введите имя пользователя MySQL: " MYSQL_USER
    read -s -p "Введите пароль MySQL: " MYSQL_PASSWORD
    echo
    
    colorized_echo green "MySQL настроен"
}

# Настройка Telegram бота
setup_telegram_bot() {
    colorized_echo blue "Настройка Telegram бота"
    
    read -p "Введите Telegram Bot API ключ: " TELEGRAM_API_TOKEN
    read -p "Введите список ID администраторов (через запятую): " TELEGRAM_ADMIN_IDS
    
    colorized_echo green "Telegram бот настроен"
}

# Создание Caddyfile
create_caddyfile() {
    colorized_echo blue "Создание конфигурации Caddy"
    
    cat > "$APP_DIR/Caddyfile" << EOF
$PANEL_DOMAIN {
        reverse_proxy unix//var/lib/wildosvpn/wildosvpn.socket
}
EOF

    if [[ "$PANEL_DOMAIN" != "$SUBSCRIPTION_DOMAIN" ]]; then
        cat >> "$APP_DIR/Caddyfile" << EOF

$SUBSCRIPTION_DOMAIN {
        reverse_proxy unix//var/lib/wildosvpn/wildosvpn.socket
}
EOF
    fi
    
    colorized_echo green "Caddyfile создан"
}

# Создание docker-compose.yml с Caddy для WildosVPN
create_docker_compose_with_caddy() {
    colorized_echo blue "Создание docker-compose.yml с поддержкой Caddy для WildosVPN"
    
    cat > "$COMPOSE_FILE" << EOF
services:
  wildosvpn:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    env_file: .env
    network_mode: host
    volumes:
      - /var/lib/wildosvpn:/var/lib/wildosvpn
      # Монтирование шаблонов для визуального мастера инбаундов
      - ./templates:/opt/wildosvpn/templates:ro
      # Обеспечение доступа к пользовательским шаблонам
      - /var/lib/wildosvpn/templates:/var/lib/wildosvpn/templates
    environment:
      # Путь к пользовательским шаблонам
      - CUSTOM_TEMPLATES_DIRECTORY=/var/lib/wildosvpn/templates/"
      # Включение визуального мастера инбаундов
      - ENABLE_INBOUND_WIZARD=true
    depends_on:
      - caddy

  caddy:
    image: caddy:latest
    restart: always
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/lib/wildosvpn:/var/lib/wildosvpn
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
EOF
    
    log_action "docker-compose.yml создан для локальной сборки WildosVPN"
    colorized_echo green "docker-compose.yml создан с поддержкой Caddy для WildosVPN"
}

# Создание .env файла
create_env_file() {
    colorized_echo blue "Создание файла .env"
    
    # Генерация JWT секрета
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || tr -dc A-Za-z0-9 </dev/urandom | head -c 64)
    
    # Настройка базы данных
    if [[ "$USE_MYSQL" == true ]]; then
        DATABASE_URL="mysql+pymysql://$MYSQL_USER:$MYSQL_PASSWORD@$MYSQL_HOST:$MYSQL_PORT/$MYSQL_DB"
    else
        DATABASE_URL="sqlite:////var/lib/wildosvpn/db.sqlite3"
    fi
    
    cat > "$ENV_FILE" << EOF
# Конфигурация WildosVPN
SQLALCHEMY_DATABASE_URL="$DATABASE_URL"

# Настройки Uvicorn для работы с Caddy через Unix Socket
UVICORN_UDS=/var/lib/wildosvpn/wildosvpn.socket

# URL префикс для подписок
XRAY_SUBSCRIPTION_URL_PREFIX=https://$SUBSCRIPTION_DOMAIN

# Настройки визуального мастера инбаундов
ENABLE_INBOUND_WIZARD=true
INBOUND_TEMPLATES_DIRECTORY=templates
CUSTOM_TEMPLATES_DIRECTORY=/var/lib/wildosvpn/templates/

# Настройки Xray
XRAY_EXECUTABLE_PATH="/usr/local/bin/xray"
XRAY_ASSETS_PATH="/usr/local/share/xray"

# Настройки JWT токена
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_SECRET="$JWT_SECRET"

# Настройки администратора
SUDO_USERNAME="$SUDO_USERNAME"
SUDO_PASSWORD="$SUDO_PASSWORD"

# Настройки журналирования
UVICORN_LOG_LEVEL="info"

# Дополнительные настройки
DOCS=true
DEBUG=false
EOF

    # Добавление настроек резервного копирования
    if [[ "$ENABLE_BACKUP_SERVICE" == true ]]; then
        cat >> "$ENV_FILE" << EOF

# Настройки резервного копирования
BACKUP_SERVICE_ENABLED=true
BACKUP_TELEGRAM_BOT_KEY="$BACKUP_TELEGRAM_BOT_KEY"
BACKUP_TELEGRAM_CHAT_ID="$BACKUP_TELEGRAM_CHAT_ID"
BACKUP_CRON_SCHEDULE="$BACKUP_CRON_SCHEDULE"
EOF
    fi

    # Добавление настроек Telegram бота
    if [[ "$USE_TELEGRAM_BOT" == true ]]; then
        cat >> "$ENV_FILE" << EOF

# Настройки Telegram бота
TELEGRAM_API_TOKEN="$TELEGRAM_API_TOKEN"
TELEGRAM_ADMIN_IDS="$TELEGRAM_ADMIN_IDS"
EOF
    fi
    
    colorized_echo green "Файл .env создан с полной конфигурацией"
}

# Создание структуры директорий
create_directories() {
    colorized_echo blue "Создание структуры директорий"
    
    # Создание основных директорий
    mkdir -p "$APP_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$DATA_DIR/templates"
    mkdir -p "$DATA_DIR/templates/"{basic,websocket,grpc,reality,modern,production,special}
    mkdir -p "$DATA_DIR/logs"
    mkdir -p "$DATA_DIR/certs"
    mkdir -p "$BACKUP_DIR"
    
    # Установка правильных разрешений
    chown -R 1000:1000 "$DATA_DIR"
    chmod -R 755 "$DATA_DIR"
    chmod -R 755 "$BACKUP_DIR"
    
    colorized_echo green "Структура директорий создана"
}

# Установка основных пакетов
install_dependencies() {
    colorized_echo blue "Установка зависимостей"
    
    # Обновление системы
    detect_and_update_package_manager
    
    # Установка необходимых пакетов
    install_package "curl"
    install_package "wget"
    install_package "git"
    install_package "unzip"
    install_package "systemd"
    
    # Установка Docker если не установлен
    if ! command -v docker &> /dev/null; then
        install_docker
    else
        colorized_echo green "Docker уже установлен"
    fi
    
    # Проверка docker compose
    detect_compose
    
    colorized_echo green "Зависимости установлены"
}

# Скачивание проекта
download_project() {
    colorized_echo blue "Скачивание проекта из репозитория $WILDOSVPN_REPO"
    
    # Удаление старой версии если существует
    if [ -d "$APP_DIR" ]; then
        colorized_echo yellow "Найдена существующая установка. Создание резервной копии..."
        mv "$APP_DIR" "$APP_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Создание директории приложения
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    colorized_echo blue "Скачивание из репозитория $WILDOSVPN_REPO"
    
    # Попытка получить последний релиз
    LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$WILDOSVPN_REPO/releases/latest" 2>/dev/null | grep "tarball_url" | cut -d '"' -f 4)
    
    if [ -n "$LATEST_RELEASE" ]; then
        colorized_echo blue "Скачивание последнего релиза"
        if ! curl -L "$LATEST_RELEASE" | tar -xz --strip-components=1; then
            colorized_echo yellow "Ошибка скачивания релиза, пробуем master ветку"
            rm -rf ./*
            curl -L "https://github.com/$WILDOSVPN_REPO/archive/main.tar.gz" | tar -xz --strip-components=1 2>/dev/null || \
            curl -L "https://github.com/$WILDOSVPN_REPO/archive/master.tar.gz" | tar -xz --strip-components=1
        fi
    else
        colorized_echo yellow "Не удалось получить последний релиз, скачиваем основную ветку"
        # Пробуем сначала main, потом master
        if ! curl -L "https://github.com/$WILDOSVPN_REPO/archive/main.tar.gz" | tar -xz --strip-components=1 2>/dev/null; then
            curl -L "https://github.com/$WILDOSVPN_REPO/archive/master.tar.gz" | tar -xz --strip-components=1
        fi
    fi
    
    colorized_echo green "Проект $WILDOSVPN_REPO успешно скачан"
}

# Установка Node.js для сборки фронтенда
install_nodejs() {
    # Пропускаем установку Node.js если сборка фронтенда отключена
    if [[ "$SKIP_FRONTEND_BUILD" == true ]]; then
        colorized_echo yellow "Установка Node.js пропущена (сборка фронтенда отключена)"
        return 0
    fi
    
    colorized_echo blue "Проверка наличия Node.js для сборки фронтенда"
    
    # Проверяем версию Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            colorized_echo green "Node.js уже установлен (версия $(node --version))"
            return 0
        else
            colorized_echo yellow "Установлена старая версия Node.js, обновляем..."
        fi
    fi
    
    # Установка Node.js в зависимости от ОС
    colorized_echo blue "Установка Node.js LTS"
    
    if [[ "$OS" == "Ubuntu"* ]] || [[ "$OS" == "Debian"* ]]; then
        # Добавление официального репозитория NodeSource
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
        $PKG_MANAGER install -y nodejs
    elif [[ "$OS" == "CentOS"* ]] || [[ "$OS" == "AlmaLinux"* ]]; then
        # Включение EPEL репозитория и установка из NodeSource
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
        $PKG_MANAGER install -y nodejs
    elif [ "$OS" == "Fedora"* ]; then
        $PKG_MANAGER install -y nodejs npm
    elif [ "$OS" == "Arch" ]; then
        $PKG_MANAGER -S --noconfirm nodejs npm
    elif [[ "$OS" == "openSUSE"* ]]; then
        $PKG_MANAGER install -y nodejs npm
    else
        # Универсальная установка через официальный скрипт
        colorized_echo yellow "Используется универсальная установка Node.js"
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
        apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null || pacman -S --noconfirm nodejs 2>/dev/null
    fi
    
    # Проверка успешности установки
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        colorized_echo green "Node.js успешно установлен (версия $(node --version))"
        colorized_echo green "npm версия: $(npm --version)"
    else
        colorized_echo red "Ошибка установки Node.js"
        exit 1
    fi
}

# Сборка фронтенда
build_frontend() {
    # Проверка флага пропуска сборки фронтенда
    if [[ "$SKIP_FRONTEND_BUILD" == true ]]; then
        colorized_echo yellow "=============================================="
        colorized_echo yellow "      Сборка фронтенда пропущена             "
        colorized_echo yellow "=============================================="
        return 0
    fi
    
    colorized_echo blue "=============================================="
    colorized_echo blue "         Сборка фронтенда WildosVPN           "
    colorized_echo blue "=============================================="
    
    # Проверка наличия исходных файлов фронтенда
    if [ ! -d "$APP_DIR/app/dashboard" ]; then
        colorized_echo yellow "Директория фронтенда не найдена, пропускаем сборку"
        return 0
    fi
    
    if [ ! -f "$APP_DIR/app/dashboard/package.json" ]; then
        colorized_echo yellow "package.json не найден, пропускаем сборку фронтенда"
        return 0
    fi
    
    cd "$APP_DIR/app/dashboard"
    
    # Очистка существующего build
    if [ -d "build" ]; then
        colorized_echo blue "Очистка старого build директории"
        rm -rf build
        log_action "Старый build удален"
    fi
    
    # Очистка node_modules для чистой установки
    if [ -d "node_modules" ]; then
        colorized_echo blue "Очистка node_modules для чистой установки"
        rm -rf node_modules
        rm -f package-lock.json
    fi
    
    # Установка зависимостей
    colorized_echo blue "Установка зависимостей фронтенда..."
    if ! npm ci --production=false; then
        colorized_echo yellow "npm ci не удался, пробуем npm install"
        npm install
    fi
    
    # Генерация типов для Chakra UI (если есть скрипт)
    if npm run gen:theme-typings >/dev/null 2>&1; then
        colorized_echo blue "Генерация типов темы Chakra UI"
        npm run gen:theme-typings
    fi
    
    # Сборка проекта
    colorized_echo blue "Сборка фронтенда (TypeScript + Vite)..."
    if npm run build; then
        colorized_echo green "✓ Фронтенд успешно собран"
        
        # Проверка результата сборки
        if [ -d "build" ] && [ -f "build/index.html" ]; then
            BUILD_SIZE=$(du -sh build | cut -f1)
            colorized_echo green "✓ Размер собранного фронтенда: $BUILD_SIZE"
            
            # Подсчет количества файлов
            FILE_COUNT=$(find build -type f | wc -l)
            colorized_echo green "✓ Количество файлов в build: $FILE_COUNT"
            
            log_action "Фронтенд успешно собран: $BUILD_SIZE, $FILE_COUNT файлов"
        else
            colorized_echo red "Ошибка: build директория не создана или повреждена"
            exit 1
        fi
    else
        colorized_echo red "Ошибка сборки фронтенда!"
        colorized_echo yellow "Проверьте логи выше для деталей ошибки"
        exit 1
    fi
    
    # Очистка временных файлов после сборки
    colorized_echo blue "Очистка временных файлов после сборки"
    rm -rf node_modules
    rm -f package-lock.json
    
    cd "$APP_DIR"
    colorized_echo green "=============================================="
    colorized_echo green "    Сборка фронтенда завершена успешно!      "
    colorized_echo green "=============================================="
}

# Функция установки с кроном для резервного копирования
install_backup_cron() {
    if [[ "$ENABLE_BACKUP_SERVICE" == true ]]; then
        colorized_echo blue "Настройка автоматического резервного копирования"
        
        # Создание директории для резервных копий
        mkdir -p /var/lib/wildosvpn/backups
        log_action "Создана директория для резервных копий"
        
        # Создание улучшенного скрипта резервного копирования
        cat > "/usr/local/bin/wildosvpn-backup" << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/lib/wildosvpn/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/wildosvpn_backup_$DATE.tar.gz"

# Создание резервной копии
cd /opt/wildosvpn
tar -czf "$BACKUP_FILE" .env docker-compose.yml Caddyfile /var/lib/wildosvpn/

# Удаление резервных копий старше 30 дней
find "$BACKUP_DIR" -name "wildosvpn_backup_*.tar.gz" -mtime +30 -delete

echo "Резервная копия создана: $BACKUP_FILE"

# Отправка в Telegram если настроено
if [ -f "/usr/local/bin/wildosvpn" ]; then
    /usr/local/bin/wildosvpn send-backup
fi
EOF
        chmod +x "/usr/local/bin/wildosvpn-backup"
        
        # Добавление в crontab
        (crontab -l 2>/dev/null; echo "$BACKUP_CRON_SCHEDULE /usr/local/bin/wildosvpn-backup") | crontab -
        
        log_action "Автоматическое резервное копирование настроено"
        colorized_echo green "Автоматическое резервное копирование настроено"
    fi
}

# Проверка и отображение статуса установки
check_installation_status() {
    colorized_echo blue "Проверка статуса установки..."
    
    # Проверка статуса контейнеров
    sleep 15
    
    cd "$APP_DIR"
    if $COMPOSE ps | grep -q "Up"; then
        colorized_echo green "=============================================="
        colorized_echo green "    Установка успешно завершена!             "
        colorized_echo green "=============================================="
        colorized_echo green "Панель управления: https://$PANEL_DOMAIN"
        colorized_echo green "Подписки: https://$SUBSCRIPTION_DOMAIN"
        colorized_echo green ""
        colorized_echo green "Логин администратора: $SUDO_USERNAME"
        if [[ "$USE_CUSTOM_ADMIN" == true ]]; then
            colorized_echo green "Пароль: [настроен пользователем]"
        else
            colorized_echo green "Пароль: $SUDO_PASSWORD"
            colorized_echo yellow "ВАЖНО: Обязательно смените пароль после первого входа!"
        fi
        colorized_echo green ""
        colorized_echo cyan "Полезная информация:"
        colorized_echo cyan "• Файл конфигурации: $ENV_FILE"
        colorized_echo cyan "• Директория данных: $DATA_DIR"
        colorized_echo cyan "• Шаблоны инбаундов: $DATA_DIR/templates/"
        if [[ "$ENABLE_BACKUP_SERVICE" == true ]]; then
            colorized_echo cyan "• Автоматические резервные копии: включены"
        fi
        colorized_echo green "=============================================="
        colorized_echo cyan "Команды управления:"
        colorized_echo cyan "  wildosvpn start    - Запуск"
        colorized_echo cyan "  wildosvpn stop     - Остановка"
        colorized_echo cyan "  wildosvpn restart  - Перезапуск"
        colorized_echo cyan "  wildosvpn logs     - Просмотр логов"
        colorized_echo cyan "  wildosvpn backup   - Создание резервной копии"
        colorized_echo cyan "  wildosvpn update   - Обновление"
        colorized_echo green "=============================================="
        
        # Тест доступности домена
        colorized_echo blue "Проверка доступности SSL сертификата..."
        sleep 5
        if curl -s -k "https://$PANEL_DOMAIN" >/dev/null 2>&1; then
            colorized_echo green "✓ Панель доступна по https://$PANEL_DOMAIN"
        else
            colorized_echo yellow "⚠ Панель может быть недоступна. Проверьте:"
            colorized_echo yellow "  - DNS записи для домена $PANEL_DOMAIN"
            colorized_echo yellow "  - Открыты ли порты 80 и 443"
            colorized_echo yellow "  - Логи Caddy: docker logs caddy"
        fi
    else
        colorized_echo red "=============================================="
        colorized_echo red "    Ошибка установки!                        "
        colorized_echo red "=============================================="
        colorized_echo red "Контейнеры не запустились. Проверьте логи:"
        colorized_echo red "$COMPOSE logs --tail=20"
        colorized_echo yellow ""
        colorized_echo yellow "Для диагностики выполните:"
        colorized_echo yellow "  cd $APP_DIR"
        colorized_echo yellow "  $COMPOSE logs wildosvpn"
        colorized_echo yellow "  $COMPOSE logs caddy"
        exit 1
    fi
}

# Запуск установки
run_installation() {
    colorized_echo blue "=============================================="
    colorized_echo blue "  Интерактивный установщик WildosVPN  "
    colorized_echo blue "    с полной настройкой SSL через Caddy       "
    colorized_echo blue "=============================================="
    
    # Проверка прав root
    check_running_as_root
    
    # Определение ОС
    detect_os
    colorized_echo green "Обнаружена ОС: $OS"
    
    # Проверка системных требований
    check_system_requirements
    
    # Интерактивные настройки
    setup_admin
    setup_domain
    setup_additional_options
    
    # Показать итоговую конфигурацию
    colorized_echo blue "=============================================="
    colorized_echo blue "       Итоговая конфигурация установки        "
    colorized_echo blue "=============================================="
    colorized_echo cyan "Репозиторий: $WILDOSVPN_REPO"
    colorized_echo cyan "Администратор: $SUDO_USERNAME"
    colorized_echo cyan "Домен панели: $PANEL_DOMAIN"
    colorized_echo cyan "Домен подписок: $SUBSCRIPTION_DOMAIN"
    colorized_echo cyan "База данных: $([ "$USE_MYSQL" == true ] && echo "MySQL" || echo "SQLite")"
    colorized_echo cyan "Резервные копии: $([ "$ENABLE_BACKUP_SERVICE" == true ] && echo "включены" || echo "отключены")"
    colorized_echo cyan "Telegram бот: $([ "$USE_TELEGRAM_BOT" == true ] && echo "включен" || echo "отключен")"
    colorized_echo cyan "Сборка фронтенда: $([ "$SKIP_FRONTEND_BUILD" == true ] && echo "пропущена" || echo "будет выполнена")"
    colorized_echo blue "=============================================="
    
    read -p "Продолжить установку? (y/n): " confirm_install
    if [[ ! "$confirm_install" =~ ^[Yy]$ ]]; then
        colorized_echo yellow "Установка отменена пользователем"
        exit 0
    fi
    
    # Установка зависимостей
    install_dependencies
    
    # Создание директорий
    create_directories
    
    # Скачивание проекта
    download_project
    
    # Установка Node.js и сборка фронтенда
    install_nodejs
    build_frontend
    
    # Создание конфигурационных файлов
    create_docker_compose_with_caddy
    create_caddyfile
    create_env_file
    
    # Копирование шаблонов если они есть
    if [ -d "./templates" ]; then
        colorized_echo blue "Копирование шаблонов"
        cp -r ./templates/* "$DATA_DIR/templates/"
        chown -R 1000:1000 "$DATA_DIR/templates/"
    fi
    
    # Установка скрипта управления
    install_wildosvpn_script
    
    # Настройка резервного копирования
    install_backup_cron
    
    # Запуск контейнеров
    colorized_echo blue "Запуск контейнеров..."
    cd "$APP_DIR"
    
    # Проверка конфигурации
    if ! $COMPOSE config > /dev/null 2>&1; then
        colorized_echo red "Ошибка в конфигурации docker-compose.yml"
        exit 1
    fi
    
    # Загрузка образов
    colorized_echo blue "Загрузка Docker образов..."
    $COMPOSE pull
    
    # Запуск
    $COMPOSE up -d
    
    # Проверка статуса
    check_installation_status
}

# ===================================================================
# ДОПОЛНИТЕЛЬНЫЕ УПРАВЛЯЮЩИЕ ФУНКЦИИ
# ===================================================================

# Проверка установки WildosVPN
is_wildosvpn_installed() {
    if [ -d "$APP_DIR" ]; then
        return 0
    else
        return 1
    fi
}

# Обновление скрипта выполняется через основную функцию install_wildosvpn_script

# Функция запуска сервисов
start_services() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен. Используйте команду 'install'"
        exit 1
    fi
    
    colorized_echo blue "Запуск сервисов WildosVPN..."
    cd "$APP_DIR"
    detect_compose
    $COMPOSE up -d
    colorized_echo green "Сервисы WildosVPN запущены"
}

# Функция остановки сервисов
stop_services() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    colorized_echo blue "Остановка сервисов WildosVPN..."
    cd "$APP_DIR"
    detect_compose
    $COMPOSE down
    colorized_echo green "Сервисы WildosVPN остановлены"
}

# Функция перезапуска сервисов
restart_services() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    colorized_echo blue "Перезапуск сервисов WildosVPN..."
    cd "$APP_DIR"
    detect_compose
    $COMPOSE restart
    colorized_echo green "Сервисы WildosVPN перезапущены"
}

# Функция просмотра логов
show_logs() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    cd "$APP_DIR"
    detect_compose
    
    # Проверяем наличие контейнеров
    if ! $COMPOSE ps >/dev/null 2>&1; then
        colorized_echo red "Контейнеры WildosVPN не найдены. Проверьте установку."
        exit 1
    fi
    
    colorized_echo blue "Показ логов WildosVPN (нажмите Ctrl+C для выхода)..."
    $COMPOSE logs -f --tail=100
}

# Функция статуса
show_status() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    cd "$APP_DIR"
    detect_compose
    
    colorized_echo blue "Статус контейнеров WildosVPN:"
    if $COMPOSE ps 2>/dev/null; then
        echo ""
        colorized_echo blue "Дисковое пространство:"
        df -h "$DATA_DIR" 2>/dev/null || echo "Ошибка получения информации о диске"
    else
        colorized_echo red "Ошибка получения статуса контейнеров"
        exit 1
    fi
}

# Функция создания резервной копии конфигурации (автоматический бекап)
create_config_backup() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    colorized_echo blue "Создание резервной копии конфигурации..."
    
    # Создание директории для резервных копий
    mkdir -p "$BACKUP_DIR"
    
    # Создание архива только с конфигурационными файлами
    BACKUP_FILE="$BACKUP_DIR/wildosvpn-config-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # Подготовка временной директории для конфигов
    TEMP_DIR="/tmp/wildosvpn-config-$(date +%s)"
    mkdir -p "$TEMP_DIR"
    
    cd "$APP_DIR"
    detect_compose
    
    # Копирование конфигурационных файлов с учетом Docker окружения
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$TEMP_DIR/"
    elif get_config_from_docker 2>/dev/null && [ -f "/tmp/.env.wildosvpn.tmp" ]; then
        cp "/tmp/.env.wildosvpn.tmp" "$TEMP_DIR/.env"
        rm -f "/tmp/.env.wildosvpn.tmp"
    fi
    
    if [ -f "$APP_DIR/Caddyfile" ]; then
        cp "$APP_DIR/Caddyfile" "$TEMP_DIR/"
    fi
    
    if [ -f "$COMPOSE_FILE" ]; then
        cp "$COMPOSE_FILE" "$TEMP_DIR/"
    fi
    
    # Копирование пользовательских шаблонов
    if [ -d "$DATA_DIR/templates" ]; then
        cp -r "$DATA_DIR/templates" "$TEMP_DIR/"
    elif [ -d "$APP_DIR/templates" ]; then
        # В случае если шаблоны находятся в директории приложения
        cp -r "$APP_DIR/templates" "$TEMP_DIR/"
    fi
    
    # Попробуем извлечь дополнительные конфигурационные файлы из контейнера
    if ! [ -f "$TEMP_DIR/.env" ] && $COMPOSE ps wildosvpn >/dev/null 2>&1; then
        colorized_echo blue "Попытка извлечь дополнительные конфигурации из контейнера..."
        $COMPOSE cp wildosvpn:/var/lib/wildosvpn/. "$TEMP_DIR/container_data/" 2>/dev/null || true
    fi
    
    # Создание архива
    cd "$TEMP_DIR"
    tar -czf "$BACKUP_FILE" . 2>/dev/null || true
    
    # Очистка временных файлов
    rm -rf "$TEMP_DIR"
    
    colorized_echo green "Резервная копия конфигурации создана: $BACKUP_FILE"
    
    # Отправка в Telegram если настроено
    if [ -f "$ENV_FILE" ] && grep -q "BACKUP_SERVICE_ENABLED=true" "$ENV_FILE"; then
        send_backup_to_telegram "$BACKUP_FILE"
    fi
}

# Функция создания полной резервной копии (ручной бекап)
create_full_backup() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    colorized_echo blue "Создание полной резервной копии WildosVPN..."
    
    # Создание директории для резервных копий
    mkdir -p "$BACKUP_DIR"
    
    # Создание полного архива
    BACKUP_FILE="$BACKUP_DIR/wildosvpn-full-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
    
    cd "$INSTALL_DIR"
    tar -czf "$BACKUP_FILE" \
        --exclude="$APP_NAME/logs" \
        --exclude="*/logs" \
        "$APP_NAME" \
        "../var/lib/$APP_NAME" 2>/dev/null || true
    
    colorized_echo green "Полная резервная копия создана: $BACKUP_FILE"
    
    # Показать размер архива
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        colorized_echo cyan "Размер архива: $BACKUP_SIZE"
    fi
}

# Проверка, запущен ли скрипт в Docker окружении
is_running_in_docker() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null
}

# Проверка доступности Docker Compose
check_docker_compose_available() {
    if ! command -v docker >/dev/null 2>&1; then
        colorized_echo red "Docker не установлен или недоступен"
        return 1
    fi
    
    if ! docker compose version >/dev/null 2>&1 && ! docker-compose version >/dev/null 2>&1; then
        colorized_echo red "Docker Compose не установлен или недоступен"
        return 1
    fi
    
    return 0
}

# Диагностика состояния Docker контейнеров
diagnose_docker_state() {
    colorized_echo blue "Диагностика состояния Docker контейнеров..."
    
    if ! check_docker_compose_available; then
        return 1
    fi
    
    cd "$APP_DIR" 2>/dev/null || {
        colorized_echo red "Директория приложения $APP_DIR не найдена"
        return 1
    }
    
    detect_compose
    
    # Проверка конфигурации docker-compose
    if [ -f "$COMPOSE_FILE" ]; then
        colorized_echo green "Файл docker-compose.yml найден"
        if $COMPOSE config >/dev/null 2>&1; then
            colorized_echo green "Конфигурация docker-compose валидна"
        else
            colorized_echo red "Ошибка в конфигурации docker-compose.yml"
            return 1
        fi
    else
        colorized_echo red "Файл docker-compose.yml не найден в $APP_DIR"
        return 1
    fi
    
    # Проверка статуса контейнеров
    if $COMPOSE ps >/dev/null 2>&1; then
        local container_status=$($COMPOSE ps --format "table {{.Service}}\t{{.State}}\t{{.Status}}")
        echo ""
        colorized_echo blue "Статус контейнеров:"
        echo "$container_status"
        echo ""
    else
        colorized_echo yellow "Не удалось получить статус контейнеров"
    fi
    
    # Проверка наличия .env файла
    if [ -f "$ENV_FILE" ]; then
        colorized_echo green "Файл .env найден на хосте"
    else
        colorized_echo yellow "Файл .env не найден на хосте: $ENV_FILE"
        if get_config_from_docker 2>/dev/null; then
            colorized_echo green "Конфигурация доступна из контейнера"
            rm -f "/tmp/.env.wildosvpn.tmp"
        else
            colorized_echo red "Конфигурация недоступна"
        fi
    fi
    
    return 0
}

# Получение конфигурации из Docker контейнера
get_config_from_docker() {
    colorized_echo blue "Извлечение конфигурации из Docker контейнера..."
    
    # Проверяем статус контейнера
    if ! $COMPOSE ps wildosvpn >/dev/null 2>&1; then
        colorized_echo yellow "Контейнер wildosvpn не найден, попробуем получить конфигурацию из томов"
        return 1
    fi
    
    # Попытка извлечь .env файл из контейнера
    if $COMPOSE cp wildosvpn:.env "/tmp/.env.wildosvpn.tmp" 2>/dev/null; then
        colorized_echo green "Конфигурация .env извлечена из контейнера"
        return 0
    fi
    
    # Если файл .env недоступен, попробуем получить переменные окружения
    if $COMPOSE exec -T wildosvpn printenv | grep -E "^(SQLALCHEMY_DATABASE_URL|UVICORN_|XRAY_|JWT_|TELEGRAM_|ENABLE_|CUSTOM_|DOCS|DEBUG|SUDO_USERNAME|SUDO_PASSWORD)=" > "/tmp/.env.wildosvpn.tmp" 2>/dev/null; then
        if [ -s "/tmp/.env.wildosvpn.tmp" ]; then
            colorized_echo green "Конфигурация извлечена из переменных окружения контейнера"
            return 0
        fi
    fi
    
    colorized_echo red "Не удалось извлечь конфигурацию из контейнера"
    return 1
}

# Функция обновления WildosVPN
update_wildosvpn() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    colorized_echo blue "Обновление WildosVPN..."
    
    # Создание резервной копии перед обновлением
    colorized_echo blue "Создание резервной копии WildosVPN..."
    create_full_backup
    
    cd "$APP_DIR"
    detect_compose
    
    # Сохранение всей конфигурации перед обновлением
    CONFIG_SAVED=false
    CADDYFILE_SAVED=false
    COMPOSE_SAVED=false
    
    # Сохранение .env файла
    if [ -f "$ENV_FILE" ]; then
        colorized_echo blue "Сохранение существующей конфигурации .env"
        cp "$ENV_FILE" "/tmp/.env.wildosvpn.tmp"
        CONFIG_SAVED=true
    else
        colorized_echo yellow "env file $ENV_FILE not found: stat $ENV_FILE: no such file or directory"
        
        # Попытка получить конфигурацию из запущенного контейнера
        if get_config_from_docker; then
            CONFIG_SAVED=true
        else
            colorized_echo red "ОШИБКА: Не удалось получить конфигурацию"
            colorized_echo yellow "Проверьте, что контейнер запущен или .env файл существует"
            exit 1
        fi
    fi
    
    # Сохранение Caddyfile
    if [ -f "$APP_DIR/Caddyfile" ]; then
        colorized_echo blue "Сохранение существующего Caddyfile"
        cp "$APP_DIR/Caddyfile" "/tmp/Caddyfile.wildosvpn.tmp"
        CADDYFILE_SAVED=true
    fi
    
    # Сохранение docker-compose.yml
    if [ -f "$COMPOSE_FILE" ]; then
        colorized_echo blue "Сохранение существующего docker-compose.yml"
        cp "$COMPOSE_FILE" "/tmp/docker-compose.wildosvpn.tmp"
        COMPOSE_SAVED=true
    fi
    
    # Остановка сервисов только после сохранения конфигурации
    colorized_echo blue "Остановка сервисов..."
    $COMPOSE down
    
    # Скачивание обновлений
    download_project
    
    # Восстановление всех конфигурационных файлов
    if [ "$CONFIG_SAVED" = true ] && [ -f "/tmp/.env.wildosvpn.tmp" ]; then
        colorized_echo green "Восстановление конфигурации .env"
        cp "/tmp/.env.wildosvpn.tmp" "$ENV_FILE"
        rm -f "/tmp/.env.wildosvpn.tmp"
    else
        colorized_echo red "ОШИБКА: Конфигурация .env не была сохранена"
        exit 1
    fi
    
    # Восстановление Caddyfile или создание нового
    if [ "$CADDYFILE_SAVED" = true ] && [ -f "/tmp/Caddyfile.wildosvpn.tmp" ]; then
        colorized_echo green "Восстановление существующего Caddyfile"
        cp "/tmp/Caddyfile.wildosvpn.tmp" "$APP_DIR/Caddyfile"
        rm -f "/tmp/Caddyfile.wildosvpn.tmp"
    else
        colorized_echo yellow "Создание нового Caddyfile"
        create_caddyfile
    fi
    
    # Восстановление docker-compose.yml или создание нового
    if [ "$COMPOSE_SAVED" = true ] && [ -f "/tmp/docker-compose.wildosvpn.tmp" ]; then
        colorized_echo green "Восстановление существующего docker-compose.yml"
        cp "/tmp/docker-compose.wildosvpn.tmp" "$COMPOSE_FILE"
        rm -f "/tmp/docker-compose.wildosvpn.tmp"
    else
        colorized_echo yellow "Создание нового docker-compose.yml"
        create_docker_compose_with_caddy
    fi
    
    # Проверка наличия Node.js и пересборка фронтенда
    if [ -d "$APP_DIR/app/dashboard" ] && [ -f "$APP_DIR/app/dashboard/package.json" ]; then
        echo ""
        read -p "Пересобрать фронтенд при обновлении? (y/n) [по умолчанию: y]: " rebuild_frontend_choice
        if [[ ! "$rebuild_frontend_choice" =~ ^[Nn]$ ]]; then
            colorized_echo blue "Обнаружен фронтенд, выполняется пересборка..."
            SKIP_FRONTEND_BUILD=false
            install_nodejs
            build_frontend
        else
            colorized_echo yellow "Сборка фронтенда пропущена по выбору пользователя"
        fi
    else
        colorized_echo yellow "Фронтенд не обнаружен, пропускаем сборку"
    fi
    
    # Запуск обновленных сервисов
    $COMPOSE pull
    $COMPOSE up -d
    
    colorized_echo green "WildosVPN успешно обновлен"
}

# Функция удаления WildosVPN
uninstall_wildosvpn() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    colorized_echo red "ВНИМАНИЕ! Это действие удалит WildosVPN полностью!"
    read -p "Вы уверены? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        colorized_echo yellow "Удаление отменено"
        exit 0
    fi
    
    # Создание резервной копии перед удалением
    colorized_echo blue "Создание резервной копии перед удалением..."
    create_full_backup
    
    cd "$APP_DIR"
    detect_compose
    
    # Остановка и удаление контейнеров
    $COMPOSE down --volumes --remove-orphans
    
    # Удаление файлов
    colorized_echo blue "Удаление файлов..."
    rm -rf "$APP_DIR"
    rm -rf "$DATA_DIR"
    
    # Удаление cron задач
    crontab -l 2>/dev/null | grep -v "wildosvpn" | crontab - 2>/dev/null || true
    
    colorized_echo green "WildosVPN полностью удален"
}

# Функция управления администратором
admin_management() {
    if ! is_wildosvpn_installed; then
        colorized_echo red "WildosVPN не установлен"
        exit 1
    fi
    
    cd "$APP_DIR"
    detect_compose
    
    # Проверяем, что контейнер запущен
    if ! $COMPOSE ps wildosvpn | grep -q "Up"; then
        colorized_echo red "Контейнер WildosVPN не запущен. Запустите его командой: wildosvpn start"
        exit 1
    fi
    
    colorized_echo blue "Управление администратором WildosVPN"
    echo "1. Изменить пароль администратора"
    echo "2. Создать нового администратора"
    echo "3. Показать список администраторов"
    read -p "Выберите действие (1-3): " choice
    
    case $choice in
        1)
            read -p "Введите имя пользователя: " username
            read -s -p "Введите новый пароль: " password
            echo
            
            if $COMPOSE exec wildosvpn wildosvpn admin update --username "$username" --password "$password"; then
                colorized_echo green "Пароль администратора обновлен"
            else
                colorized_echo red "Ошибка при обновлении пароля администратора"
            fi
            ;;
        2)
            read -p "Введите имя нового администратора: " username
            read -s -p "Введите пароль: " password
            echo
            
            if $COMPOSE exec wildosvpn wildosvpn admin create --username "$username" --password "$password" --sudo; then
                colorized_echo green "Новый администратор создан"
            else
                colorized_echo red "Ошибка при создании администратора"
            fi
            ;;
        3)
            if ! $COMPOSE exec wildosvpn wildosvpn admin list; then
                colorized_echo red "Ошибка при получении списка администраторов"
            fi
            ;;
        *)
            colorized_echo red "Неверный выбор"
            ;;
    esac
}

# Интерактивное меню для выбора команды
show_interactive_menu() {
    while true; do
        echo ""
        colorized_echo blue "=============================================="
        colorized_echo blue "          WildosVPN Management Script         "
        colorized_echo blue "=============================================="
        echo "Доступные команды:"
        echo "  1. install       - Установить WildosVPN"
        echo "  2. start         - Запустить сервисы"
        echo "  3. stop          - Остановить сервисы"
        echo "  4. restart       - Перезапустить сервисы"
        echo "  5. status        - Показать статус сервисов"
        echo "  6. logs          - Показать логи"
        echo "  7. backup-config - Автоматический бекап конфигов"
        echo "  8. backup-full   - Полный ручной бекап"
        echo "  9. update        - Обновить WildosVPN"
        echo " 10. admin         - Управление администраторами"
        echo " 11. diagnose      - Диагностика Docker контейнеров"
        echo " 12. uninstall     - Удалить WildosVPN"
        echo " 13. script-update - Обновить этот скрипт"
        echo "  0. exit          - Выход"
        echo ""
        colorized_echo blue "=============================================="
        echo ""
        read -p "Выберите команду (0-13 или название): " choice
        
        case "$choice" in
            "1"|"install")
                check_running_as_root
                run_installation
                ;;
            "2"|"start")
                check_running_as_root
                start_services
                ;;
            "3"|"stop")
                check_running_as_root
                stop_services
                ;;
            "4"|"restart")
                check_running_as_root
                restart_services
                ;;
            "5"|"status")
                show_status
                ;;
            "6"|"logs")
                show_logs
                ;;
            "7"|"backup-config")
                check_running_as_root
                create_config_backup
                ;;
            "8"|"backup-full")
                check_running_as_root
                create_full_backup
                ;;
            "9"|"update")
                check_running_as_root
                update_wildosvpn
                ;;
            "10"|"admin")
                check_running_as_root
                admin_management
                ;;
            "11"|"diagnose")
                diagnose_docker_state
                ;;
            "12"|"uninstall")
                check_running_as_root
                uninstall_wildosvpn
                ;;
            "13"|"script-update")
                check_running_as_root
                install_wildosvpn_script
                ;;
            "0"|"exit"|"quit"|"q")
                colorized_echo green "До свидания!"
                exit 0
                ;;
            "")
                # Пустой ввод - продолжаем цикл
                continue
                ;;
            *)
                colorized_echo red "Неизвестная команда: $choice"
                colorized_echo yellow "Попробуйте снова или введите 0 для выхода"
                ;;
        esac
        
        # После выполнения команды спрашиваем, продолжить ли
        echo ""
        read -p "Нажмите Enter для возврата в меню или введите 'exit' для выхода: " continue_choice
        if [[ "$continue_choice" =~ ^(exit|quit|q)$ ]]; then
            colorized_echo green "До свидания!"
            exit 0
        fi
    done
}

# Главная функция выбора команды
main() {
    if [ $# -eq 0 ]; then
        show_interactive_menu
    fi
    
    case "$1" in
        "install")
            check_running_as_root
            run_installation
            ;;
        "start")
            check_running_as_root
            start_services
            ;;
        "stop")
            check_running_as_root
            stop_services
            ;;
        "restart")
            check_running_as_root
            restart_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "backup-config")
            check_running_as_root
            create_config_backup
            ;;
        "backup-full")
            check_running_as_root
            create_full_backup
            ;;
        "backup")
            # Обратная совместимость - по умолчанию создаем полный бекап
            check_running_as_root
            create_full_backup
            ;;
        "update")
            check_running_as_root
            update_wildosvpn
            ;;
        "admin")
            check_running_as_root
            admin_management
            ;;
        "diagnose")
            diagnose_docker_state
            ;;
        "uninstall")
            check_running_as_root
            uninstall_wildosvpn
            ;;
        "script-update")
            check_running_as_root
            install_wildosvpn_script
            ;;
        *)
            colorized_echo red "Неизвестная команда: $1"
            colorized_echo yellow "Используйте 'wildosvpn' без параметров для просмотра доступных команд"
            exit 1
            ;;
    esac
}

# Функция отправки резервной копии в Telegram (из оригинального скрипта)
send_backup_to_telegram() {
    local backup_file_path="${1:-}"
    
    # Попытка загрузить переменные окружения из .env файла
    if [ -f "$ENV_FILE" ]; then
        while IFS='=' read -r key value; do
            if [[ -z "$key" || "$key" =~ ^# ]]; then
                continue
            fi
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs | sed 's/^"\(.*\)"$/\1/')
            if [[ "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
                export "$key"="$value"
            fi
        done < "$ENV_FILE"
    elif [ -d "$APP_DIR" ]; then
        # Попытка получить переменные из запущенного контейнера
        cd "$APP_DIR"
        detect_compose
        if $COMPOSE ps wildosvpn >/dev/null 2>&1; then
            # Извлекаем переменные окружения для Telegram
            local telegram_vars=$($COMPOSE exec -T wildosvpn printenv | grep -E "^(BACKUP_SERVICE_ENABLED|BACKUP_TELEGRAM_BOT_KEY|BACKUP_TELEGRAM_CHAT_ID)=" 2>/dev/null || echo "")
            if [ -n "$telegram_vars" ]; then
                while IFS='=' read -r key value; do
                    if [[ -n "$key" && -n "$value" ]]; then
                        export "$key"="$value"
                    fi
                done <<< "$telegram_vars"
            fi
        fi
    fi

    # Проверка настроек резервного копирования
    if [ "$BACKUP_SERVICE_ENABLED" != "true" ]; then
        colorized_echo yellow "Служба резервного копирования не включена"
        return
    fi
    
    if [ -z "$BACKUP_TELEGRAM_BOT_KEY" ] || [ -z "$BACKUP_TELEGRAM_CHAT_ID" ]; then
        colorized_echo red "Отсутствуют настройки Telegram для отправки резервных копий"
        return
    fi

    local server_ip=$(curl -s ifconfig.me || echo "Unknown IP")
    
    # Использовать переданный путь или найти последний бекап
    if [ -n "$backup_file_path" ] && [ -f "$backup_file_path" ]; then
        local backup_path="$backup_file_path"
        local backup_filename=$(basename "$backup_path")
    else
        local latest_backup=$(ls -t "$BACKUP_DIR" | head -n 1)
        local backup_path="$BACKUP_DIR/$latest_backup"
        local backup_filename="$latest_backup"
    fi

    if [ ! -f "$backup_path" ]; then
        colorized_echo red "Резервные копии не найдены"
        return
    fi

    local backup_time=$(date "+%Y-%m-%d %H:%M:%S %Z")
    local caption="📦 *WildosVPN Backup*\\n🌐 *Server IP*: \`${server_ip}\`\\n📁 *File*: \`${backup_filename}\`\\n⏰ *Time*: \`${backup_time}\`"
    
    curl -s -F chat_id="$BACKUP_TELEGRAM_CHAT_ID" \
        -F document=@"$backup_path" \
        -F caption="$caption" \
        -F parse_mode="MarkdownV2" \
        "https://api.telegram.org/bot$BACKUP_TELEGRAM_BOT_KEY/sendDocument" >/dev/null 2>&1 && \
    colorized_echo green "Резервная копия отправлена в Telegram" || \
    colorized_echo red "Ошибка отправки в Telegram"
}

# Запуск главной функции
main "$@"
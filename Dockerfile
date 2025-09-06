ARG PYTHON_VERSION=3.12

FROM python:$PYTHON_VERSION-slim AS build

ENV PYTHONUNBUFFERED=1

WORKDIR /code

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl unzip gcc python3-dev libpq-dev \
    && curl -L https://raw.githubusercontent.com/wildos-dev/WildosVPN/main/scripts/install_latest_xray.sh | bash \
    && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /code/
RUN python3 -m pip install --upgrade pip setuptools \
    && pip install --no-cache-dir --upgrade -r /code/requirements.txt

FROM python:$PYTHON_VERSION-slim

ENV PYTHON_LIB_PATH=/usr/local/lib/python${PYTHON_VERSION%.*}/site-packages
WORKDIR /code

RUN rm -rf $PYTHON_LIB_PATH/*

COPY --from=build $PYTHON_LIB_PATH $PYTHON_LIB_PATH
COPY --from=build /usr/local/bin /usr/local/bin
COPY --from=build /usr/local/share/xray /usr/local/share/xray

COPY . /code

# Создание директорий для шаблонов и настройка прав для WildosVPN
RUN mkdir -p /opt/wildosvpn/templates \
    && mkdir -p /var/lib/wildosvpn/templates/{basic,websocket,grpc,reality,modern,production,special} \
    && ln -s /code/wildosvpn-cli.py /usr/bin/wildosvpn-cli \
    && chmod +x /usr/bin/wildosvpn-cli

# Копирование шаблонов WildosVPN в образ
COPY ./templates /opt/wildosvpn/templates

# Метаданные образа
LABEL org.opencontainers.image.title="WildosVPN"
LABEL org.opencontainers.image.description="Enhanced VPN management panel for Xray-core"
LABEL org.opencontainers.image.source="https://github.com/wildos-dev/WildosVPN"
LABEL org.opencontainers.image.vendor="wildos-dev"

CMD ["bash", "-c", "alembic upgrade head; python main.py"]

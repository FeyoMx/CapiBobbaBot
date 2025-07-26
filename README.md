# CapiBobbaBot 🧋

Un chatbot de WhatsApp para la tienda de bubble tea "CapiBobba", diseñado para automatizar la toma de pedidos y responder preguntas de los clientes de forma inteligente.

Este proyecto utiliza la **API Cloud de WhatsApp** y la **API de Google Gemini** para ofrecer una experiencia de conversación fluida y eficiente.

## ✨ Características

-   **Menú Interactivo**: Saluda a los usuarios y les presenta un menú principal con botones para una fácil navegación.
-   **Flujo de Pedidos Guiado**: Toma los pedidos generados desde una aplicación de menú web y guía al usuario para obtener la dirección de entrega y el método de pago.
-   **Inteligencia Artificial**: Utiliza Google Gemini para responder preguntas de formato libre sobre el menú, promociones, horarios y más, basándose en un contexto de negocio predefinido.
-   **Notificaciones a Administradores**: Envía notificaciones en tiempo real a los administradores sobre nuevos pedidos, solicitudes de contacto o problemas.
-   **Integración con n8n**: Envía todos los eventos de la conversación a un webhook de n8n para análisis, seguimiento y automatización de procesos de backend.
-   **Persistencia de Estado con Redis**: Mantiene el estado de la conversación de cada usuario de forma persistente, permitiendo que el bot recuerde el contexto incluso si el servidor se reinicia.

## 🛠️ Tecnologías Utilizadas

-   **Backend**: Node.js, Express.js
-   **API de Mensajería**: WhatsApp Cloud API (Meta for Developers)
-   **Inteligencia Artificial**: Google Gemini API
-   **Base de Datos de Estado**: Redis
-   **Automatización/Análisis**: n8n (vía Webhooks)
-   **Despliegue**: Preparado para Render.com (o cualquier otra PaaS)

## 🚀 Puesta en Marcha

Para ejecutar este proyecto localmente, sigue estos pasos:

### 1. Prerrequisitos

-   Node.js (v18 o superior)
-   Redis (se puede ejecutar localmente con Docker: `docker run -d -p 6379:6379 redis`)
-   Una cuenta de Meta for Developers con una App configurada para la API de WhatsApp.
-   Una clave de API de Google Gemini.
-   (Opcional) Un flujo de trabajo en n8n con un webhook activado para recibir los datos.
-   Una cuenta de GitHub.
-   Una cuenta en [Render.com](https://render.com/) (o similar).

### 2. Configuración Local

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/FeyoMx/CapiBobbaBot.git # Reemplaza con la URL de tu repositorio
    cd CapiBobbaBot
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Crea el archivo de variables de entorno:**
    Copia el archivo `.env.example` a un nuevo archivo llamado `.env` y rellena los valores correspondientes.

    ```env
    # Credenciales de la API de WhatsApp de Meta
    VERIFY_TOKEN="tu_token_de_verificacion_secreto"
    WHATSAPP_TOKEN="tu_token_de_acceso_permanente_secreto"
    PHONE_NUMBER_ID="tu_id_de_numero_de_telefono"

    # Clave de API de Google Gemini
    GEMINI_API_KEY="tu_api_key_de_gemini_secreta"

    # Números de WhatsApp de los administradores (separados por coma, sin espacios)
    # Ejemplo: 521XXXXXXXXXX,521YYYYYYYYYY
    ADMIN_WHATSAPP_NUMBERS="tu_numero_de_admin1,tu_numero_de_admin2"

    # URL del Webhook de n8n para recibir los eventos del bot
    N8N_WEBHOOK_URL="https://tu-instancia.n8n.com/webhook/tu-id-de-webhook"

    # URL de conexión a tu base de datos Redis
    # Ejemplo local (Docker): REDIS_URL="redis://localhost:6379"
    REDIS_URL="redis://user:password@host:port"
    ```

4.  **Ejecuta el bot:**
    ```bash
    npm start
    ```
    El servidor se iniciará, por lo general en el puerto 3000 o el que esté definido en tu entorno.

## 📂 Estructura del Proyecto

```
.
├── chatbot.js          # Lógica principal del bot, servidor Express y manejo de webhooks.
├── business_data.js    # Centraliza toda la información del negocio (menú, promos, etc.).
├── .env.example        # Archivo de ejemplo para las variables de entorno.
├── .env                # (Local) Archivo para guardar las claves de API y tokens.
├── PRIVACY_POLICY.md   # Política de privacidad para Meta.
├── package.json        # Dependencias y scripts del proyecto.
├── .gitignore          # Archivos y carpetas a ignorar por Git.
└── README.md           # Este archivo.
```

## 📄 Política de Privacidad

La política de privacidad que cumple con los requisitos de Meta se puede encontrar [aquí](https://feyomx.github.io/CapiBobbaBot/PRIVACY_POLICY.html).

## ✍️ Autor

-   **FeyoMx** - GitHub

## 📜 Licencia

Este proyecto está bajo la Licencia ISC.

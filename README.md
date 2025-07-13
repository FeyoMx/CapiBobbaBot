# CapiBobbaBot 🧋

Un chatbot de WhatsApp para la tienda de bubble tea "CapiBobba", diseñado para automatizar la toma de pedidos y responder preguntas de los clientes.

Este proyecto utiliza la **API Cloud de WhatsApp** y la **API de Google Gemini** para ofrecer una experiencia de conversación fluida y eficiente.

## ✨ Características

-   **Menú Interactivo**: Saluda a los usuarios y les presenta un menú principal con botones para una fácil navegación.
-   **Flujo de Pedidos Guiado**: Toma los pedidos generados desde una aplicación de menú web y guía al usuario para obtener la dirección de entrega y el método de pago.
-   **Inteligencia Artificial**: Utiliza Google Gemini para responder preguntas de formato libre sobre el menú, promociones, horarios y más, basándose en un contexto de negocio predefinido.
-   **Manejo de Comandos**: Responde a comandos específicos como "menú", "promociones", "horario", etc.
-   **Despliegue Sencillo**: Preparado para un despliegue rápido en plataformas como Render.com.

## 🛠️ Tecnologías Utilizadas

-   **Backend**: Node.js, Express.js
-   **API de Mensajería**: WhatsApp Cloud API (Meta for Developers)
-   **Inteligencia Artificial**: Google Gemini API
-   **Despliegue**: Render.com (o cualquier otra PaaS)

## 🚀 Puesta en Marcha

Para ejecutar este proyecto localmente, sigue estos pasos:

### 1. Prerrequisitos

-   Node.js (v18 o superior)
-   Una cuenta de Meta for Developers con una App configurada para la API de WhatsApp.
-   Una clave de API de Google Gemini.
-   Una cuenta de GitHub.
-   Una cuenta en [Render.com](https://render.com/) (o similar).

### 2. Configuración Local

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/FeyoMx/CapiBobbaBot.git
    cd CapiBobbaBot
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Crea el archivo de variables de entorno:**
    Crea un archivo llamado `.env` en la raíz del proyecto y añade las siguientes variables:

    ```env
    # Token para verificar tu webhook con Meta
    VERIFY_TOKEN=tu_token_secreto_de_verificacion

    # Token de acceso permanente de tu app de Meta
    WHATSAPP_TOKEN=tu_token_de_whatsapp

    # ID del número de teléfono de producción registrado en Meta
    PHONE_NUMBER_ID=tu_id_de_numero_de_telefono

    # Tu clave de API de Google Gemini
    GEMINI_API_KEY=tu_api_key_de_gemini
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
├── package.json        # Dependencias y scripts del proyecto.
├── .env                # (Local) Archivo para guardar las claves de API y tokens.
├── .gitignore          # Archivos y carpetas a ignorar por Git.
└── README.md           # Este archivo.
```

## 📄 Política de Privacidad

La política de privacidad que cumple con los requisitos de Meta se puede encontrar [aquí](https://feyomx.github.io/CapiBobbaBot/PRIVACY_POLICY.html).

## ✍️ Autor

-   **FeyoMx** - GitHub

## 📜 Licencia

Este proyecto está bajo la Licencia ISC.


/**
 * business_data.js
 *
 * Este archivo centraliza toda la información del negocio que el chatbot necesita.
 *
 * Se define un objeto `businessData` como la "única fuente de verdad".
 * Luego, una función `generateBusinessContext` crea la cadena de texto
 * que se pasa a la IA, asegurando consistencia y facilidad de mantenimiento.
 */

/**
 * Objeto que contiene todos los datos del negocio de forma estructurada.
 * Esta es la ÚNICA fuente de verdad. Para actualizar el menú, precios, etc.,
 * solo se debe modificar este objeto.
 */
const businessData = {
    menu: {
        baseAguaFrappe: {
            name: "Bebidas Base Agua Frappe",
            price: 75.00,
            items: ["Litchi", "Blueberry", "Guanábana", "Piña colada", "Fresa", "Sandia", "Mango", "Maracuya", "Tamarindo", "Cereza", "Banana"]
        },
        baseLecheFrappe: {
            name: "Bebidas Base Leche Frappe",
            price: 75.00,
            items: ["Taro", "Chai", "Cookies&cream", "Pay de limon", "Crema irlandesa", "Mazapan", "Mocha", "Chocolate Mexicano", "Matcha", "Algodon de Azucar"]
        },
        calientes: {
            name: "Bebidas Calientes",
            price: 60.00,
            description: "Pueden ser de cualquier sabor base leche"
        },
        especialidades: {
            name: "Especialidades",
            items: [
                { name: "Chamoyada", price: 80.00, description: "Puede ser de cualquier sabor base agua" },
                { name: "Yogurtada", price: 80.00, description: "Puede ser de cualquier sabor base frutal" },
                { name: "Fresas con crema", price: 75.00 }
            ]
        },
        toppings: {
            name: "Toppings",
            price: 10.00,
            items: ["Perlas explosivas de frutos rojos", "Perlas explosivas de litchi", "Perlas explosivas de manzana verde", "Tapioca extra", "Jelly Arcoiris", "Perlas Cristal"]
        }
    },
    howToOrder: [
        "La manera mas rapida de hacerlo es en nuestro menu https://feyomx.github.io/menucapibobba/ ahi seleccionas tus bebidas y toppings",
        "Tu Bebida puede ser de leche entera o leche deslactosada, si no especificas se te enviara con leche entera."
    ],
    promotions: [
        { name: "Combo día Lluvioso", description: "2 bebidas calientes del mismo sabor por $110." },
        { name: "Combo Amigos", description: "2 Frappe base agua del mismo sabor por $130." }
    ],
    info: {
        schedule: "Lunes a Viernes de 6:00 PM a 10:00 PM. Sábados y Domingos de 12:00 PM a 10:00 PM.",
        delivery: "Servicio a domicilio GRATIS en: Viñedos, Esmeralda, San Alfonso, Rinconada de Esmeralda, Residencial Aurora, Lindavista, Santa Matilde, Los ciruelos, Real de joyas, Real Toledo, Real Navarra, Privada del sol, Qvalta, Señeros, Villa San Juan, Privada Diamante, Sendero de los pino, Mineral del Oro, Platinum, Bosques de Santa Matilde.",
        location: "No tenemos local fisico solo servicio a domicilio.",
        paymentMethods: {
            types: ["Efectivo", "Transferencia"],
            transferDetails: {
                bank: "MERCADO PAGO W",
                accountNumber: "722969010305501833",
                name: "Maria Elena Martinez Flores",
                instructions: "Por favor, envía tu comprobante de pago a este mismo chat para confirmar tu pedido."
            }
        }
    }
};

/**
 * Genera una cadena de texto formateada con la información del negocio.
 * Esta función toma el objeto `businessData` y lo convierte en el contexto
 * que la IA puede entender fácilmente.
 * @param {object} data - El objeto businessData.
 * @returns {string} - El contexto del negocio formateado.
 */
function generateBusinessContext(data) {
    // Helper para formatear precios
    const formatPrice = (price) => `$${price.toFixed(2)}`;

    // Construcción del menú
    let menuText = "**Menú de CapiBoba:**\n";
    for (const categoryKey in data.menu) {
        const category = data.menu[categoryKey];
        menuText += `- ${category.name}\n`;
        if (category.items) {
            if (Array.isArray(category.items) && typeof category.items[0] === 'object') {
                // Items con precios individuales (ej. temporada)
                category.items.forEach(item => {
                    menuText += `-- ${item.name}: ${formatPrice(item.price)}${item.description ? ` (${item.description})` : ''}\n`;
                });
            } else {
                // Items con precio de categoría (ej. base agua/leche o toppings)
                if (category.price) {
                    menuText += `-- Todos a ${formatPrice(category.price)}\n`;
                }
                category.items.forEach(item => {
                    menuText += `--- ${item}\n`;
                });
            }
        } else if (category.price) {
            // Categorías con un solo precio y descripción (ej. calientes)
            menuText += `-- Precio: ${formatPrice(category.price)} (${category.description})\n`;
        }
    }

    // Cómo pedir
    let howToOrderText = "\n**Como Pedir?**\n";
    data.howToOrder.forEach(line => {
        howToOrderText += `- ${line}\n`;
    });

    // Promociones
    let promotionsText = "\n**Promociones Actuales:**\n";
    data.promotions.forEach(promo => {
        promotionsText += `- ${promo.name}: ${promo.description}\n`;
    });

    // Información general
    let infoText = "\n**Información de Pago y Horarios:**\n";
    infoText += `- Horario: ${data.info.schedule}\n`;
    infoText += `- Solo servicio a domicilio: ${data.info.delivery}\n`;
    infoText += `- Ubicacion: ${data.info.location}\n`;
    infoText += `- Pago en ${data.info.paymentMethods.types.join(' o ')}\n`;
    const { transferDetails } = data.info.paymentMethods;
    infoText += `- Para transferencias, puedes usar la siguiente cuenta:\n`;
    infoText += `-- Banco: ${transferDetails.bank}\n`;
    infoText += `-- Número de Cuenta: ${transferDetails.accountNumber}\n`;
    infoText += `-- A nombre de: ${transferDetails.name}\n`;
    infoText += `-- ${transferDetails.instructions}\n`;

    return (menuText + howToOrderText + promotionsText + infoText).trim();
}

// Generamos el contexto a partir del objeto de datos
const BUSINESS_CONTEXT = generateBusinessContext(businessData);

// Exportamos el contexto para que el chatbot.js pueda usarlo sin cambios.
module.exports = {
    BUSINESS_CONTEXT,
    businessData // Opcional: exportar también el objeto por si se necesita en otro lado
};
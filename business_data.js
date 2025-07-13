/**
 * business_data.js
 * 
 * Este archivo centraliza toda la información del negocio que el chatbot necesita.
 * Separar los datos de la lógica hace que sea más fácil actualizar el menú,
 * las promociones o los horarios sin tocar el código principal del bot.
 */

const BUSINESS_CONTEXT = `
**Menú de CapiBoba:**
- Bebidas Base Agua Frappe
- Litchi: $75.00 
- Blueberry: $75.00
- Guanábana: $75.00
- Piña colada: $75.00
- Fresa: $75.00 
- Sandia: $ 75.00
- Mango: $75.00
- Maracuya: $75.00
- Tamarindo: $75.00
- Bebidas Base Leche Frappe
- Taro: $75.00
- Chai: $75.00
- Cookies&cream: $75.00
- Pay de limon: $75.00
- Crema irlandesa: $75.00
- Mazapan: $75.00
- Mocha: $75.00
- Chocolate Mexicano: $75.00
- Matcha: $75.00
- Bebidas Calientes: $60.00 Pueden ser de cualquier sabor base leche
- Bebidas de temporada
- Chamoyada: $80.00 Puede ser de cualquier sabor base agua
- Fresas con crema: $75.00
- Toppings
- Perlas explosivas de frutos rojos: $10.00
- Perlas explosivas de litchi: $10.00
- Perlas explosivas de manzana verde: $10.00
- Tapioca extra: $10.00
- Jelly Arcoiris: $10.00
- Perlas Cristal: $10.00

**Como Pedir?**
- la manera mas rapida de hacerlo es en nuestro menu https://feyomx.github.io/Menu-CapiBobba-/ ahi seleccionas tus bebidas y toppings
**Promociones Actuales:**
- Combo día Lluvioso: 2 bebidas calientes del mismo sabor por $110.
- Combo Amigos: 2 Frappe base agua del mismo sabor por $130.

**Información de Pago y Horarios:**
- Horario: Lunes a Viernes de 6:00 PM a 10:00 PM. Sábados y Domingos de 12:00 PM a 10:00 PM.
- Solo servicio a domicilio: Servicio a domicilio GRATIS en fraccionamientos aledaños a Viñedos.
- Ubicacion : No tenemos local fisico solo servicio a domicilio.
- Pago en efectivo o transferencia
- Para transferencias, puedes usar la siguiente cuenta:
- Banco: MERCADO PAGO W
- Número de Cuenta: 722969010305501833
- A nombre de: Maria Elena Martinez Flores
- Por favor, envía tu comprobante de pago a este mismo chat para confirmar tu pedido.`;

module.exports = {
    BUSINESS_CONTEXT
};
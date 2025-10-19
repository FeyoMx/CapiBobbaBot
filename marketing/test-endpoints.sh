#!/bin/bash

# Script de prueba para endpoints de marketing
# Ejecutar después de que el deploy en Render esté completo

API_URL="https://capibobbabot.onrender.com"

echo "🧪 Iniciando pruebas de endpoints de marketing..."
echo "================================================"
echo ""

# Test 1: Verificar que el servidor esté activo
echo "1️⃣ Verificando servidor..."
curl -s "$API_URL/health" | grep -q "healthy" && echo "✅ Servidor OK" || echo "❌ Servidor no responde"
echo ""

# Test 2: Listar campañas (debe estar vacío inicialmente)
echo "2️⃣ Listando campañas existentes..."
curl -s "$API_URL/api/marketing/campaigns"
echo ""
echo ""

# Test 3: Crear campaña de prueba
echo "3️⃣ Creando campaña de prueba..."
CAMPAIGN_RESPONSE=$(curl -s -X POST "$API_URL/api/marketing/campaign/create" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_tracking_2025_01",
    "name": "Campaña de Prueba - Sistema de Tracking",
    "templateName": "test_template",
    "description": "Primera campaña de prueba para validar el sistema de tracking"
  }')

echo "$CAMPAIGN_RESPONSE"
echo ""

# Verificar si se creó correctamente
echo "$CAMPAIGN_RESPONSE" | grep -q "success.*true" && echo "✅ Campaña creada" || echo "❌ Error creando campaña"
echo ""

# Test 4: Verificar que aparece en la lista
echo "4️⃣ Verificando que la campaña aparece en la lista..."
curl -s "$API_URL/api/marketing/campaigns" | grep -q "test_tracking_2025_01" && echo "✅ Campaña listada" || echo "❌ Campaña no aparece"
echo ""

# Test 5: Obtener detalle de la campaña
echo "5️⃣ Obteniendo detalle de la campaña..."
curl -s "$API_URL/api/marketing/campaign/test_tracking_2025_01"
echo ""
echo ""

# Test 6: Obtener estadísticas (deben estar en 0)
echo "6️⃣ Obteniendo estadísticas de la campaña..."
curl -s "$API_URL/api/marketing/campaign/test_tracking_2025_01/stats"
echo ""
echo ""

# Test 7: Simular registro de mensaje
echo "7️⃣ Simulando registro de mensaje..."
MESSAGE_RESPONSE=$(curl -s -X POST "$API_URL/api/marketing/register-message" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "wamid.TEST123456789",
    "campaignId": "test_tracking_2025_01",
    "recipient": "5215512345678",
    "templateName": "test_template",
    "sentAt": '$(date +%s000)'
  }')

echo "$MESSAGE_RESPONSE"
echo ""
echo "$MESSAGE_RESPONSE" | grep -q "success.*true" && echo "✅ Mensaje registrado" || echo "❌ Error registrando mensaje"
echo ""

# Test 8: Verificar que las stats se actualizaron
echo "8️⃣ Verificando actualización de estadísticas..."
STATS=$(curl -s "$API_URL/api/marketing/campaign/test_tracking_2025_01/stats")
echo "$STATS" | grep -q '"totalSent":1' && echo "✅ Stats actualizadas (totalSent: 1)" || echo "⚠️  Stats no actualizadas"
echo ""

# Test 9: Obtener mensajes de la campaña
echo "9️⃣ Obteniendo mensajes de la campaña..."
curl -s "$API_URL/api/marketing/campaign/test_tracking_2025_01/messages"
echo ""
echo ""

# Test 10: Obtener dashboard stats general
echo "🔟 Obteniendo estadísticas del dashboard..."
curl -s "$API_URL/api/marketing/dashboard-stats"
echo ""
echo ""

echo "================================================"
echo "✅ Pruebas completadas!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verificar que todos los tests pasaron"
echo "2. Revisar los logs en Render para confirmar que no hay errores"
echo "3. Modificar el workflow de n8n (ID: qSKrf1OiNFS6ZbSu)"
echo "4. Enviar mensajes reales de prueba"
echo ""
echo "📖 Consulta marketing/EJEMPLO_USO.md para más información"

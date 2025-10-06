'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MaintenanceModeToggle } from '@/components/MaintenanceModeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Store, Cpu, Shield, Save, RefreshCw } from 'lucide-react';

// Initial configuration from business_data.js
const initialBusinessConfig = {
  business_name: 'CapiBobba',
  phone_number: '+52 1 771 183 1526',
  location: 'No tenemos local físico, solo servicio a domicilio',
  opening_hours: 'Lunes a Viernes de 6:00 PM a 10:00 PM. Sábados y Domingos de 12:00 PM a 10:00 PM',
  delivery_zones: 'Viñedos, Esmeralda, San Alfonso, Rinconada de Esmeralda, Residencial Aurora, Lindavista, Santa Matilde, Los ciruelos, Real de joyas, Real Toledo, Real Navarra, Privada del sol, Qvalta, Señeros, Villa San Juan, Privada Diamante, Sendero de los pino, Mineral del Oro, Platinum, Bosques de Santa Matilde',
  delivery_fee: 0, // GRATIS en zonas especificadas
  payment_methods: 'Efectivo, Transferencia',
  bank_name: 'MERCADO PAGO W',
  bank_account: '722969010305501833',
  bank_account_name: 'Maria Elena Martinez Flores',
  menu_url: 'https://feyomx.github.io/menucapibobba/',
  whatsapp_business_id: 'WHATSAPP_BUSINESS_ID',
  phone_number_id: 'PHONE_NUMBER_ID',
};

const initialGeminiConfig = {
  model: 'gemini-flash-latest',
  temperature: 0.7,
  max_tokens: 8192,
  cache_enabled: true,
  cache_ttl_hours: 24,
  safety_settings: {
    harassment: 'BLOCK_MEDIUM_AND_ABOVE',
    hate_speech: 'BLOCK_MEDIUM_AND_ABOVE',
    sexually_explicit: 'BLOCK_MEDIUM_AND_ABOVE',
    dangerous_content: 'BLOCK_MEDIUM_AND_ABOVE',
  },
};

const initialSecurityConfig = {
  rate_limit_enabled: true,
  max_messages_per_minute: 10,
  max_messages_per_hour: 100,
  auto_block_spam: true,
  backup_enabled: true,
  backup_interval_hours: 6,
};

export default function ConfiguracionPage() {
  const [businessConfig, setBusinessConfig] = useState(initialBusinessConfig);
  const [geminiConfig, setGeminiConfig] = useState(initialGeminiConfig);
  const [securityConfig, setSecurityConfig] = useState(initialSecurityConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBusinessConfig = async () => {
    setIsSaving(true);
    try {
      // TODO: Call API endpoint to save business config
      // await apiClient.updateBusinessConfig(businessConfig);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      alert('✅ Configuración del negocio guardada exitosamente');
    } catch (error) {
      alert('❌ Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeminiConfig = async () => {
    setIsSaving(true);
    try {
      // TODO: Call API endpoint to save Gemini config
      // await apiClient.updateGeminiConfig(geminiConfig);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      alert('✅ Configuración de Gemini guardada exitosamente');
    } catch (error) {
      alert('❌ Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurityConfig = async () => {
    setIsSaving(true);
    try {
      // TODO: Call API endpoint to save security config
      // await apiClient.updateSecurityConfig(securityConfig);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      alert('✅ Configuración de seguridad guardada exitosamente');
    } catch (error) {
      alert('❌ Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Configuración
          </h2>
          <p className="text-muted-foreground">
            Gestiona la configuración del negocio, Gemini AI y seguridad
          </p>
        </div>

        {/* Configuration Tabs */}
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="business">
              <Store className="h-4 w-4 mr-2" />
              Negocio
            </TabsTrigger>
            <TabsTrigger value="gemini">
              <Cpu className="h-4 w-4 mr-2" />
              Gemini AI
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          {/* Business Configuration */}
          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Negocio</CardTitle>
                <CardDescription>
                  Configuración básica del negocio y datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nombre del Negocio</Label>
                    <Input
                      id="business_name"
                      value={businessConfig.business_name}
                      onChange={(e) =>
                        setBusinessConfig({ ...businessConfig, business_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Teléfono de WhatsApp</Label>
                    <Input
                      id="phone_number"
                      value={businessConfig.phone_number}
                      onChange={(e) =>
                        setBusinessConfig({ ...businessConfig, phone_number: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu_url">URL del Menú</Label>
                    <Input
                      id="menu_url"
                      type="url"
                      value={businessConfig.menu_url}
                      onChange={(e) =>
                        setBusinessConfig({ ...businessConfig, menu_url: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Enlace al menú digital que se comparte con clientes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">Costo de Envío ($)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      value={businessConfig.delivery_fee}
                      onChange={(e) =>
                        setBusinessConfig({
                          ...businessConfig,
                          delivery_fee: parseFloat(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      GRATIS en zonas especificadas
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opening_hours">Horario de Atención</Label>
                  <Input
                    id="opening_hours"
                    value={businessConfig.opening_hours}
                    onChange={(e) =>
                      setBusinessConfig({ ...businessConfig, opening_hours: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Textarea
                    id="location"
                    value={businessConfig.location}
                    onChange={(e) =>
                      setBusinessConfig({ ...businessConfig, location: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_zones">Zonas de Entrega GRATIS</Label>
                  <Textarea
                    id="delivery_zones"
                    value={businessConfig.delivery_zones}
                    onChange={(e) =>
                      setBusinessConfig({ ...businessConfig, delivery_zones: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4 mt-4">Información de Pago</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="payment_methods">Métodos de Pago</Label>
                      <Input
                        id="payment_methods"
                        value={businessConfig.payment_methods}
                        onChange={(e) =>
                          setBusinessConfig({ ...businessConfig, payment_methods: e.target.value })
                        }
                        placeholder="Efectivo, Transferencia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Nombre del Banco</Label>
                      <Input
                        id="bank_name"
                        value={businessConfig.bank_name}
                        onChange={(e) =>
                          setBusinessConfig({ ...businessConfig, bank_name: e.target.value })
                        }
                        placeholder="MERCADO PAGO W"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account">Número de Cuenta</Label>
                      <Input
                        id="bank_account"
                        value={businessConfig.bank_account}
                        onChange={(e) =>
                          setBusinessConfig({ ...businessConfig, bank_account: e.target.value })
                        }
                        placeholder="722969010305501833"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account_name">Titular de la Cuenta</Label>
                      <Input
                        id="bank_account_name"
                        value={businessConfig.bank_account_name}
                        onChange={(e) =>
                          setBusinessConfig({ ...businessConfig, bank_account_name: e.target.value })
                        }
                        placeholder="Maria Elena Martinez Flores"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveBusinessConfig} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Business API</CardTitle>
                <CardDescription>Credenciales de WhatsApp Cloud API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_business_id">WhatsApp Business Account ID</Label>
                  <Input
                    id="whatsapp_business_id"
                    value={businessConfig.whatsapp_business_id}
                    onChange={(e) =>
                      setBusinessConfig({ ...businessConfig, whatsapp_business_id: e.target.value })
                    }
                    placeholder="123456789012345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number_id">Phone Number ID</Label>
                  <Input
                    id="phone_number_id"
                    value={businessConfig.phone_number_id}
                    onChange={(e) =>
                      setBusinessConfig({ ...businessConfig, phone_number_id: e.target.value })
                    }
                    placeholder="987654321098765"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  ⚠️ Estos valores se configuran en variables de entorno. Esta sección es solo para
                  referencia.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gemini AI Configuration */}
          <TabsContent value="gemini" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Modelo</CardTitle>
                <CardDescription>
                  Parámetros de Google Gemini AI para conversaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo Gemini</Label>
                    <Input
                      id="model"
                      value={geminiConfig.model}
                      onChange={(e) => setGeminiConfig({ ...geminiConfig, model: e.target.value })}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Modelo actual: {geminiConfig.model}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperatura ({geminiConfig.temperature})
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={geminiConfig.temperature}
                      onChange={(e) =>
                        setGeminiConfig({
                          ...geminiConfig,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Controla la creatividad (0-2). Mayor = más creativo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={geminiConfig.max_tokens}
                      onChange={(e) =>
                        setGeminiConfig({
                          ...geminiConfig,
                          max_tokens: parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">Límite de respuesta del modelo</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cache_ttl_hours">
                      TTL de Caché (horas)
                    </Label>
                    <Input
                      id="cache_ttl_hours"
                      type="number"
                      value={geminiConfig.cache_ttl_hours}
                      onChange={(e) =>
                        setGeminiConfig({
                          ...geminiConfig,
                          cache_ttl_hours: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="cache_enabled">Caché de Contexto Habilitado</Label>
                    <p className="text-xs text-muted-foreground">
                      Reduce costos y mejora velocidad reutilizando contexto
                    </p>
                  </div>
                  <Switch
                    id="cache_enabled"
                    checked={geminiConfig.cache_enabled}
                    onCheckedChange={(checked) =>
                      setGeminiConfig({ ...geminiConfig, cache_enabled: checked })
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveGeminiConfig} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safety Settings</CardTitle>
                <CardDescription>
                  Configuración de filtros de seguridad de Gemini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(geminiConfig.safety_settings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium capitalize">
                          {key.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  ℹ️ Los Safety Settings se configuran en el código. Esta sección es solo para
                  referencia.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Configuration */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>
                  Protección contra abuso y uso excesivo del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="rate_limit_enabled">Rate Limiting Habilitado</Label>
                    <p className="text-xs text-muted-foreground">
                      Limita mensajes por usuario para prevenir spam
                    </p>
                  </div>
                  <Switch
                    id="rate_limit_enabled"
                    checked={securityConfig.rate_limit_enabled}
                    onCheckedChange={(checked) =>
                      setSecurityConfig({ ...securityConfig, rate_limit_enabled: checked })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max_messages_per_minute">
                      Mensajes Máximos por Minuto
                    </Label>
                    <Input
                      id="max_messages_per_minute"
                      type="number"
                      value={securityConfig.max_messages_per_minute}
                      onChange={(e) =>
                        setSecurityConfig({
                          ...securityConfig,
                          max_messages_per_minute: parseInt(e.target.value),
                        })
                      }
                      disabled={!securityConfig.rate_limit_enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_messages_per_hour">Mensajes Máximos por Hora</Label>
                    <Input
                      id="max_messages_per_hour"
                      type="number"
                      value={securityConfig.max_messages_per_hour}
                      onChange={(e) =>
                        setSecurityConfig({
                          ...securityConfig,
                          max_messages_per_hour: parseInt(e.target.value),
                        })
                      }
                      disabled={!securityConfig.rate_limit_enabled}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="auto_block_spam">Bloqueo Automático de Spam</Label>
                    <p className="text-xs text-muted-foreground">
                      Bloquea automáticamente patrones sospechosos
                    </p>
                  </div>
                  <Switch
                    id="auto_block_spam"
                    checked={securityConfig.auto_block_spam}
                    onCheckedChange={(checked) =>
                      setSecurityConfig({ ...securityConfig, auto_block_spam: checked })
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveSecurityConfig} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backups Automáticos</CardTitle>
                <CardDescription>
                  Configuración de respaldos automáticos de Redis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="backup_enabled">Backups Habilitados</Label>
                    <p className="text-xs text-muted-foreground">
                      Respaldo automático de datos críticos
                    </p>
                  </div>
                  <Switch
                    id="backup_enabled"
                    checked={securityConfig.backup_enabled}
                    onCheckedChange={(checked) =>
                      setSecurityConfig({ ...securityConfig, backup_enabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup_interval_hours">
                    Intervalo de Backup (horas)
                  </Label>
                  <Input
                    id="backup_interval_hours"
                    type="number"
                    value={securityConfig.backup_interval_hours}
                    onChange={(e) =>
                      setSecurityConfig({
                        ...securityConfig,
                        backup_interval_hours: parseInt(e.target.value),
                      })
                    }
                    disabled={!securityConfig.backup_enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Frecuencia con la que se realizan los backups automáticos
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Maintenance Mode Toggle */}
        <MaintenanceModeToggle />
      </div>
    </DashboardLayout>
  );
}

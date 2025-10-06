'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Send, User, Bot, Loader2, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  type: 'incoming' | 'outgoing';
  timestamp: number;
  message?: {
    from?: string;
    text?: {
      body?: string;
    };
  };
  to?: string;
  payload?: {
    text?: {
      body?: string;
    };
  };
}

export default function ChatPage() {
  const [targetNumber, setTargetNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const fetchConversationHistory = async () => {
    if (!targetNumber) {
      toast.error('Por favor, ingresa un número de teléfono');
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message-log`);
      if (!response.ok) throw new Error('Failed to fetch messages');

      const allMessages: Message[] = await response.json();
      const filteredHistory = allMessages
        .filter(
          (msg) =>
            (msg.type === 'incoming' && msg.message?.from === targetNumber) ||
            (msg.type === 'outgoing' && msg.to === targetNumber)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      setConversationHistory(filteredHistory);
      toast.success(`Cargado historial de ${filteredHistory.length} mensajes`);
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      toast.error('No se pudo cargar el historial de conversación');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!targetNumber || !messageText.trim()) {
      toast.error('Por favor, ingresa el número y el mensaje');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: targetNumber, text: messageText }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      if (data.success) {
        toast.success('Mensaje enviado exitosamente');
        setMessageText('');
        // Refresh history after sending
        fetchConversationHistory();
      } else {
        toast.error('Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const getMessageContent = (msg: Message) => {
    if (msg.type === 'incoming') {
      return msg.message?.text?.body || '[Mensaje no de texto]';
    } else if (msg.type === 'outgoing') {
      return msg.payload?.text?.body || '[Mensaje no de texto]';
    }
    return JSON.stringify(msg);
  };

  const formatTimestamp = (timestamp: number, type: string) => {
    const date = new Date(type === 'incoming' ? timestamp * 1000 : timestamp);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Chat con Cliente
          </h2>
          <p className="text-muted-foreground">
            Envía mensajes directos a clientes por WhatsApp
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chat Configuration */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Número del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="521771..."
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: código de país + número (sin +)
                </p>
              </div>

              <Button
                className="w-full"
                onClick={fetchConversationHistory}
                disabled={!targetNumber || isLoadingHistory}
              >
                {isLoadingHistory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Cargar Historial
                  </>
                )}
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Los mensajes se sincronizan con el backend. Usa el botón de
                  cargar historial para actualizar la conversación.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversación</span>
                {targetNumber && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {targetNumber}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {conversationHistory.length} mensajes en el historial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages Area */}
              <div className="h-[400px] overflow-y-auto border rounded-lg p-4 bg-muted/10">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : conversationHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mb-2" />
                    <p>No hay historial de conversación</p>
                    <p className="text-sm">
                      {targetNumber
                        ? 'Carga el historial para ver mensajes'
                        : 'Ingresa un número para comenzar'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.type === 'incoming' ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.type === 'incoming'
                              ? 'bg-secondary'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.type === 'incoming' ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            <span className="text-xs opacity-70">
                              {formatTimestamp(msg.timestamp, msg.type)}
                            </span>
                          </div>
                          <p className="text-sm break-words">
                            {getMessageContent(msg)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  disabled={!targetNumber}
                />
                <Button
                  className="w-full"
                  onClick={handleSendMessage}
                  disabled={!targetNumber || !messageText.trim() || isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

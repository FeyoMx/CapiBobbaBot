'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orderKeys } from '@/lib/hooks/useOrders';
import { queryKeys } from '@/lib/hooks/useMetrics';
import type { WebSocketEvent } from '@/types';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketEvent | null;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  enabled?: boolean;
}

export function WebSocketProvider({
  children,
  url,
  enabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
}: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Convert http/https to ws/wss
      const websocketUrl = wsUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(websocketUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different event types
          switch (message.type) {
            case 'metrics_update':
              // Invalidate metrics queries
              queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
              break;

            case 'new_order':
            case 'order_status_change':
              // Invalidate orders queries
              queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
              break;

            case 'security_event':
              // Invalidate security stats
              queryClient.invalidateQueries({ queryKey: queryKeys.securityStats });
              break;

            case 'health_update':
              // Invalidate health check
              queryClient.invalidateQueries({ queryKey: queryKeys.health });
              break;

            default:
              console.log('[WebSocket] Unknown event type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.log('[WebSocket] Max reconnect attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [enabled, wsUrl, queryClient]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

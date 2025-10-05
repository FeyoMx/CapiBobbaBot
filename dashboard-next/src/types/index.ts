// Types for CapiBobbaBot Dashboard
// Generated: 2025-10-05

// ============================================================================
// Metrics & Analytics
// ============================================================================

export interface DashboardMetrics {
  orders: {
    today: number;
    total: number;
    trend: number; // percentage change from yesterday
  };
  revenue: {
    today: number;
    total: number;
    trend: number;
  };
  gemini: {
    calls_today: number;
    total_calls: number;
    trend: number;
  };
  cache: {
    hit_rate: number;
    trend: number;
  };
}

export interface ChartDataPoint {
  timestamp: string; // ISO string
  value: number;
  label?: string;
}

export interface SalesChartData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
}

export interface RevenueByProduct {
  product: string;
  revenue: number;
  count: number;
  percentage: number;
}

export interface GeminiUsageData {
  timestamp: string;
  calls: number;
  cache_hits: number;
  cache_misses: number;
  avg_response_time: number;
}

// ============================================================================
// Orders
// ============================================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment_method: 'cash' | 'transfer' | 'pending';
  delivery_address?: string;
  notes?: string;
  created_at: string; // ISO string
  updated_at: string;
  confirmed_at?: string;
  delivered_at?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Security Events
// ============================================================================

export type SecurityEventType =
  | 'rate_limit_exceeded'
  | 'suspicious_pattern'
  | 'invalid_token'
  | 'unauthorized_access'
  | 'webhook_validation_failed';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  phone_number?: string;
  ip_address?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SecurityStats {
  total_events: number;
  events_today: number;
  critical_events: number;
  blocked_numbers: number;
  rate_limit_hits: number;
}

// ============================================================================
// System Health
// ============================================================================

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // seconds
  timestamp: string;
  services: {
    redis: boolean;
    gemini: boolean;
    whatsapp: boolean;
    monitoring: boolean;
  };
  metrics: {
    memory_usage: number; // MB
    cpu_usage?: number; // percentage
    active_connections: number;
    error_rate: number; // percentage
  };
}

// ============================================================================
// WebSocket Events
// ============================================================================

export type WebSocketEventType =
  | 'metrics_update'
  | 'new_order'
  | 'order_status_change'
  | 'security_event'
  | 'health_update';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  data: T;
  timestamp: string;
}

// ============================================================================
// API Responses
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DateRangeParams {
  start_date?: string; // ISO string
  end_date?: string;
}

// ============================================================================
// Survey Results
// ============================================================================

export interface SurveyQuestion {
  question: string;
  type: 'rating' | 'text' | 'yes_no';
  responses: Array<{
    value: string | number;
    count: number;
    percentage: number;
  }>;
  average?: number;
}

export interface SurveyResults {
  total_responses: number;
  period: {
    start: string;
    end: string;
  };
  questions: SurveyQuestion[];
  nps_score?: number;
  satisfaction_rate?: number;
}

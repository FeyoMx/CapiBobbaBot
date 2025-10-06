// API Client for CapiBobbaBot Dashboard
// Uses Axios with TypeScript types and error handling

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  DashboardMetrics,
  Order,
  OrdersResponse,
  SecurityEvent,
  SecurityStats,
  HealthCheck,
  SurveyResults,
  PaginationParams,
  DateRangeParams,
} from '@/types';

// ============================================================================
// API Client Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // 15 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add timestamp to prevent caching
        if (config.params) {
          config.params._t = Date.now();
        } else {
          config.params = { _t: Date.now() };
        }
        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log errors for debugging
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
        });

        // Transform error to user-friendly message
        if (error.response) {
          // Server responded with error status
          const message = (error.response.data as ApiResponse)?.error || error.message;
          throw new Error(message);
        } else if (error.request) {
          // Request made but no response
          throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
        } else {
          // Something else happened
          throw new Error('Error al realizar la solicitud.');
        }
      }
    );
  }

  // ============================================================================
  // Metrics & Dashboard
  // ============================================================================

  async getMetrics(): Promise<DashboardMetrics> {
    const response = await this.client.get<ApiResponse<DashboardMetrics>>('/metrics/dashboard');

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener las métricas');
    }

    return response.data.data;
  }

  async getSalesChart(range: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const response = await this.client.get<ApiResponse<any>>(`/metrics/sales-chart`, {
      params: { range },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener los datos del gráfico de ventas');
    }

    return response.data.data;
  }

  async getRevenueByProduct(params?: DateRangeParams) {
    const response = await this.client.get<ApiResponse<any>>('/metrics/revenue-by-product', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener los ingresos por producto');
    }

    return response.data.data;
  }

  async getGeminiUsage(params?: DateRangeParams) {
    const response = await this.client.get<ApiResponse<any>>('/metrics/gemini-usage', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener las estadísticas de Gemini');
    }

    return response.data.data;
  }

  // ============================================================================
  // Orders
  // ============================================================================

  async getOrders(params?: PaginationParams & { status?: string }): Promise<OrdersResponse> {
    const response = await this.client.get<ApiResponse<OrdersResponse>>('/orders', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener los pedidos');
    }

    return response.data.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.client.get<ApiResponse<Order>>(`/orders/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudo obtener el pedido');
    }

    return response.data.data;
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    const response = await this.getOrders({ limit, sort_by: 'created_at', sort_order: 'desc' });
    return response.orders;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await this.client.patch<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudo actualizar el estado del pedido');
    }

    return response.data.data;
  }

  // ============================================================================
  // Security
  // ============================================================================

  async getSecurityEvents(params?: PaginationParams & { severity?: string }) {
    const response = await this.client.get<ApiResponse<any>>('/security/events', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener los eventos de seguridad');
    }

    return response.data.data;
  }

  async getSecurityStats(): Promise<SecurityStats> {
    const response = await this.client.get<ApiResponse<SecurityStats>>('/security/stats');

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener las estadísticas de seguridad');
    }

    return response.data.data;
  }

  async resolveSecurityEvent(id: string): Promise<SecurityEvent> {
    const response = await this.client.patch<ApiResponse<SecurityEvent>>(
      `/security/events/${id}/resolve`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudo resolver el evento');
    }

    return response.data.data;
  }

  // ============================================================================
  // System Health
  // ============================================================================

  async getHealth(): Promise<HealthCheck> {
    const response = await this.client.get<HealthCheck>('/health');
    return response.data;
  }

  async getSystemMetrics() {
    const response = await this.client.get('/monitoring/metrics');
    return response.data;
  }

  // ============================================================================
  // Survey Results
  // ============================================================================

  async getSurveyResults(params?: DateRangeParams): Promise<SurveyResults> {
    const response = await this.client.get<ApiResponse<SurveyResults>>('/survey/results', {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('No se pudieron obtener los resultados de la encuesta');
    }

    return response.data.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  getMetrics,
  getSalesChart,
  getRevenueByProduct,
  getGeminiUsage,
  getOrders,
  getOrder,
  getRecentOrders,
  updateOrderStatus,
  getSecurityEvents,
  getSecurityStats,
  resolveSecurityEvent,
  getHealth,
  getSystemMetrics,
  getSurveyResults,
} = apiClient;

// AI Service API Client for Web Admin

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";

export interface ChatRequest {
  message: string;
  includeOrders?: boolean;
  includeStock?: boolean;
  includeMovements?: boolean;
}

export interface ChatResponse {
  response: string;
  status: string;
  model: string;
  tokens_used: {
    prompt: number;
    response: number;
  };
  timestamp: string;
}

export interface SystemSummary {
  orders: {
    total_orders: number;
    completed_picking: number;
    pending_picking: number;
    pick_requested: number;
    completed_checking: number;
    dn_created: number;
    total_qty: number;
  };
  stock: {
    unique_parts: number;
    total_qty: number;
    total_locations: number;
    low_stock_items: number;
    inactive_items: number;
  };
  timestamp: string;
}

export interface ReportRequest {
  reportType: "daily_summary" | "pending_report" | "exception_report" | "stock_audit";
  days?: number;
}

export interface ReportResponse {
  report_type: string;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  exceptions: Array<Record<string, unknown>>;
  generated_at: string;
}

export interface AIInstruction {
  id: number;
  instruction_key: string;
  category: string;
  priority: number;
  title: string;
  content: string;
  conditions: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

class AIServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = AI_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`AI Service request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request<{
      service: string;
      status: string;
      ollama: { healthy: boolean; model: string };
      database: string;
      timestamp: string;
    }>("/health");
  }

  // Chat with AI assistant
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({
        message: request.message,
        include_orders: request.includeOrders || false,
        include_stock: request.includeStock || false,
        include_movements: request.includeMovements || false,
      }),
    });
  }

  // Get system summary
  async getSummary(): Promise<SystemSummary> {
    return this.request<SystemSummary>("/summary");
  }

  // Analyze data
  async analyze(
    queryType: "orders" | "stock" | "movements" | "summary",
    filters?: Record<string, unknown>,
    limit?: number
  ) {
    return this.request<{
      status: string;
      query_type: string;
      data: Record<string, unknown>;
      timestamp: string;
    }>("/analyze", {
      method: "POST",
      body: JSON.stringify({
        query_type: queryType,
        filters: filters || {},
        limit: limit || 100,
      }),
    });
  }

  // Generate report
  async generateReport(request: ReportRequest): Promise<ReportResponse> {
    return this.request<ReportResponse>("/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        report_type: request.reportType,
        days: request.days || 7,
      }),
    });
  }

  // Get report history
  async getReportsHistory(reportType?: string, days?: number) {
    const params = new URLSearchParams();
    if (reportType) params.append("report_type", reportType);
    if (days) params.append("days", days.toString());

    return this.request<{
      status: string;
      reports: Array<Record<string, unknown>>;
      count: number;
    }>(`/reports/history?${params.toString()}`);
  }

  // Get AI instructions
  async getInstructions(category?: string) {
    const params = category ? `?category=${category}` : "";
    return this.request<{
      status: string;
      instructions: AIInstruction[];
      count: number;
    }>(`/instructions${params}`);
  }
}

// Export singleton instance
export const aiService = new AIServiceClient();

// Helper functions for common operations
export const aiHelpers = {
  async getPendingOrders() {
    return aiService.analyze("orders", { status: "PENDING" }, 50);
  },

  async getLowStock() {
    return aiService.analyze("stock", { qty_lt: 10 }, 50);
  },

  async getRecentMovements(days = 3) {
    return aiService.analyze("movements", { days }, 100);
  },

  async getDailyReport() {
    return aiService.generateReport({ reportType: "daily_summary" });
  },

  async getExceptionReport() {
    return aiService.generateReport({ reportType: "exception_report" });
  },

  async askQuestion(question: string) {
    return aiService.chat({
      message: question,
      includeOrders: true,
      includeStock: true,
    });
  },
};

export default aiService;


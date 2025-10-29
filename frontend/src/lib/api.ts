import { APIResponse, SubscriptionStatus, User } from '@/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID || 'test-user-123';

function buildUrl(endpoint: string) {
  if (!API_BASE_URL) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = buildUrl(endpoint);
    const bodyIsFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers || {});

    if (DEFAULT_USER_ID && !headers.has('x-user-id')) {
      headers.set('x-user-id', DEFAULT_USER_ID);
    }

    if (!bodyIsFormData && !headers.has('Content-Type') && options.method && options.method.toUpperCase() !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    const text = await response.text();

    let data: APIResponse<T>;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: response.ok,
          data: undefined,
          error: response.ok ? undefined : text,
        };
      }
    } else {
      data = {
        success: response.ok,
      };
    }

    if (!response.ok) {
      const message = data.error || data.message || `API request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }

  async uploadFileToSignedUrl(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to storage');
    }
  }

  // Auth methods
  async getUser(userId: string): Promise<APIResponse<User>> {
    return this.request<User>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        action: 'getUser',
        userId,
      }),
    });
  }

  async createUser(userData: Partial<User>): Promise<APIResponse<User>> {
    return this.request<User>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        action: 'createUser',
        userData,
      }),
    });
  }

  // Subscription methods
  async getSubscriptionStatus(userId: string): Promise<APIResponse<SubscriptionStatus>> {
    return this.request<SubscriptionStatus>(`/subscription/status?userId=${encodeURIComponent(userId)}`);
  }

  // Stripe methods
  async createCheckoutSession(priceId: string): Promise<APIResponse<{ clientSecret: string }>> {
    return this.request<{ clientSecret: string }>('/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

  // ---------- Knowledge Base ----------
  async createKBDocumentUpload(file: File, category?: string) {
    return this.request<{ documentId: string; uploadUrl: string; s3Key: string; expiresIn: number }>('/mlops/kb/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        category,
      }),
    });
  }

  async processKBDocument(payload: {
    documentId: string;
    filename: string;
    contentType: string;
    size: number;
    category?: string;
    s3Key: string;
  }) {
    return this.request('/mlops/kb/process', {
      method: 'POST',
      body: JSON.stringify({
        documentId: payload.documentId,
        filename: payload.filename,
        contentType: payload.contentType,
        size: payload.size,
        category: payload.category,
        s3Key: payload.s3Key,
      }),
    });
  }

  async uploadKBDocument(file: File, category?: string) {
    const uploadInit = await this.createKBDocumentUpload(file, category);
    if (!uploadInit.success || !uploadInit.data) {
      return uploadInit;
    }

    await this.uploadFileToSignedUrl(uploadInit.data.uploadUrl, file);

    return this.processKBDocument({
      documentId: uploadInit.data.documentId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      category,
      s3Key: uploadInit.data.s3Key,
    });
  }

  async getKBDocuments(): Promise<APIResponse<any>> {
    return this.request<any>('/mlops/kb/documents');
  }

  async deleteKBDocument(documentId: string): Promise<APIResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/mlops/kb/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ---------- Document Analysis ----------
  async createDocumentUpload(file: File) {
    return this.request<{ documentId: string; uploadUrl: string; s3Key: string; expiresIn: number }>('/mlops/analyze/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      }),
    });
  }

  async startDocumentAnalysis(params: {
    documentId: string;
    filename: string;
    s3Key: string;
    analysisType?: string;
    priority?: string;
  }) {
    return this.request<{ analysisId: string; status: string; estimatedCompletion?: string }>('/mlops/analyze', {
      method: 'POST',
      body: JSON.stringify({
        documentId: params.documentId,
        filename: params.filename,
        analysisType: params.analysisType ?? 'compliance',
        priority: params.priority ?? 'normal',
        s3Key: params.s3Key,
      }),
    });
  }

  async uploadDocument(file: File, options?: { analysisType?: string; priority?: string }) {
    const uploadInit = await this.createDocumentUpload(file);
    if (!uploadInit.success || !uploadInit.data) {
      return uploadInit;
    }

    await this.uploadToSignedUrl(uploadInit.data.uploadUrl, file);

    const analysis = await this.startDocumentAnalysis({
      documentId: uploadInit.data.documentId,
      filename: file.name,
      s3Key: uploadInit.data.s3Key,
      analysisType: options?.analysisType,
      priority: options?.priority,
    });

    return {
      success: analysis.success,
      data: {
        documentId: uploadInit.data.documentId,
        analysisId: analysis.data?.analysisId,
        analysis,
      },
    } as APIResponse<any>;
  }

  async getAnalysisStatus(analysisId: string): Promise<APIResponse<any>> {
    return this.request<any>(`/mlops/analyze/${analysisId}`);
  }

  async getAnalysisResults(analysisId: string): Promise<APIResponse<any>> {
    return this.request<any>(`/mlops/analyze/${analysisId}/report`);
  }

  async listAnalyses(): Promise<APIResponse<any>> {
    return this.request<any>('/mlops/analyze');
  }

  // ---------- RAG Queries ----------
  async queryKnowledgeBase(queryText: string, options?: { queryType?: string; similarityThreshold?: number; maxResults?: number }) {
    return this.request<any>('/mlops/query', {
      method: 'POST',
      body: JSON.stringify({
        queryText,
        queryType: options?.queryType,
        similarityThreshold: options?.similarityThreshold,
        maxResults: options?.maxResults,
      }),
    });
  }

  async getQueryHistory() {
    return this.request<any>('/mlops/query/history');
  }

  // ---------- Health ----------
  async healthCheck(): Promise<APIResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/mlops/health');
  }
}

export const apiClient = new ApiClient();

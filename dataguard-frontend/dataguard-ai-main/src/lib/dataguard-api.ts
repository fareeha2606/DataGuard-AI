const API_BASE = 'http://127.0.0.1:8000/api';

export type Status =
  | 'Good'
  | 'Attention'
  | 'Critical'
  | 'Approved'
  | 'Conditional'
  | 'Blocked'
  | 'In review';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();

    let message = text;

    try {
      const parsed = JSON.parse(text);
      message = parsed.detail || text;
    } catch {
      // keep original response text
    }

    throw new Error(
      message || `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export const dataGuardApi = {
  // -----------------------------
  // DATASETS
  // -----------------------------

  getDatasets: async () => {
    return request<any[]>('/datasets');
  },

  getDataset: async (datasetId: string) => {
    return request<any>(`/datasets/${datasetId}`);
  },

  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return request<any>('/datasets/upload', {
      method: 'POST',
      body: formData,
    });
  },

  analyzeDataset: async (
    datasetId: string,
    targetColumn?: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/analyze`,
      {
        method: 'POST',
        body: JSON.stringify({
          target_column: targetColumn || null,
        }),
      }
    );
  },

  // -----------------------------
  // QUALITY
  // -----------------------------

  getQuality: async (datasetId: string) => {
    return request<any>(
      `/datasets/${datasetId}/quality`
    );
  },

  // -----------------------------
  // ANOMALIES
  // -----------------------------

  getAnomalies: async (datasetId: string) => {
    return request<any>(
      `/datasets/${datasetId}/anomalies`
    );
  },

  // -----------------------------
  // CLEANING
  // -----------------------------

  getCleaning: async (datasetId: string) => {
    return request<any>(
      `/datasets/${datasetId}/cleaning`
    );
  },

  simulateCleaning: async (
    datasetId: string,
    actions: any[] = []
  ) => {
    return request<any>(
      `/datasets/${datasetId}/cleaning/simulate`,
      {
        method: 'POST',
        body: JSON.stringify({
          actions,
        }),
      }
    );
  },

  applyCleaning: async (
    datasetId: string,
    actions: any[],
    approvedBy = 'user'
  ) => {
    return request<any>(
      `/datasets/${datasetId}/cleaning/apply`,
      {
        method: 'POST',
        body: JSON.stringify({
          actions,
          approved_by: approvedBy,
        }),
      }
    );
  },

  downloadCleanedDataset: (
    datasetId: string
  ) => {
    return `${API_BASE}/datasets/${datasetId}/cleaning/download`;
  },

  // -----------------------------
  // ML READINESS
  // -----------------------------

  getMlReadiness: async (
    datasetId: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/ml-readiness`
    );
  },

  // -----------------------------
  // ML RISKS
  // -----------------------------

  getMlRisks: async (
    datasetId: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/ml-risks`
    );
  },

  // -----------------------------
  // PIPELINE GATE
  // -----------------------------

  getGate: async (
    datasetId: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/gate`
    );
  },

  approveGate: async (
    datasetId: string,
    reason = 'Approved by user'
  ) => {
    return request<any>(
      `/datasets/${datasetId}/gate/approve`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason,
        }),
      }
    );
  },

  rejectGate: async (
    datasetId: string,
    reason: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/gate/reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason,
        }),
      }
    );
  },

  // -----------------------------
  // PASSPORT
  // -----------------------------

  getPassport: async (
    datasetId: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/passport`
    );
  },

  // -----------------------------
  // MONITORING
  // -----------------------------

  getMonitoring: async (
    datasetId: string
  ) => {
    return request<any>(
      `/datasets/${datasetId}/monitoring`
    );
  },
};

// -----------------------------
// CURRENT DATASET
// -----------------------------
// Compatibility helper used by ML Readiness
// and other frontend pages.

export const currentDataset = async (
  datasetId: string
) => {
  return dataGuardApi.getDataset(datasetId);
};
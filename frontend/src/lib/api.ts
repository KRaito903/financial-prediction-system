// API service for FastAPI endpoints
const API_BASE_URL = "http://127.0.0.1:5050/api";

export interface ModelInfo {
  filename: string;
  file_path: string;
  relative_path: string;
  file_size: number;
  created_time: number;
  modified_time: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    original_filename: string;
    file_path: string;
    relative_path: string;
    file_size: number;
    user_id: string;
    model_name: string;
    file_extension: string;
  };
}

class ModelAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async uploadModel(file: File, userId: string, modelName?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    if (modelName) {
      formData.append("model_name", modelName);
    }

    const response = await fetch(`${this.baseUrl}/models/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
    }

    return response.json();
  }

  async getUserModels(userId: string): Promise<{ success: boolean; data: ModelInfo[] }> {
    const response = await fetch(`${this.baseUrl}/models/user/${userId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to fetch models" }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async deleteModel(userId: string, filename: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/models/user/${userId}/model/${filename}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Delete failed" }));
      throw new Error(errorData.detail || `Delete failed with status ${response.status}`);
    }

    return response.json();
  }

  async getModelPath(userId: string, filename: string): Promise<{ success: boolean; data: { filename: string; file_path: string } }> {
    const response = await fetch(`${this.baseUrl}/models/user/${userId}/model/${filename}/path`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to get model path" }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }
}

export const modelAPI = new ModelAPI();
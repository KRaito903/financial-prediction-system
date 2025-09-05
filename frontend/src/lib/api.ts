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

// Binance API types and functions
export interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  allowTrailingStop: boolean;
  cancelReplaceAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: Record<string, unknown>[];
  permissions: string[];
  permissionSets: string[][];
  defaultSelfTradePreventionMode: string;
  allowedSelfTradePreventionModes: string[];
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: Record<string, unknown>[];
  exchangeFilters: Record<string, unknown>[];
  symbols: BinanceSymbol[];
}

export interface TradingPair {
  value: string;
  label: string;
}

const BINANCE_BASE_URL = 'https://api.binance.com';

export async function fetchTradingPairs(): Promise<TradingPair[]> {
  try {
    const response = await fetch(`${BINANCE_BASE_URL}/api/v3/exchangeInfo`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange info: ${response.status}`);
    }

    const data: BinanceExchangeInfo = await response.json();
    
    // Filter for USDT pairs that are actively trading
    const usdtPairs = data.symbols
      .filter(symbol => 
        symbol.quoteAsset === 'USDT' && 
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      )
      .map(symbol => ({
        value: `${symbol.baseAsset}/USDT`,
        label: `${symbol.baseAsset}/USDT`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return usdtPairs;
  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    // Return fallback pairs if API fails
    return [
      { value: 'BTC/USDT', label: 'BTC/USDT' },
      { value: 'ETH/USDT', label: 'ETH/USDT' },
      { value: 'BNB/USDT', label: 'BNB/USDT' },
    ];
  }
}
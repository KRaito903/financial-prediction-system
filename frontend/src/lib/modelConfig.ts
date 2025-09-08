export interface ModelOption {
  value: string;
  label: string;
  dataTypes: { value: string; label: string }[];
  predLens: number[];
  availableSymbols: string[];
  isTrainable: boolean;
}

const trainableModelSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
const allSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 
    'DOTUSDT', 'DOGEUSDT', 'LTCUSDT', 'LINKUSDT'
];

export const baseModelConfigs: ModelOption[] = [
  {
    value: 'TimeGPT',
    label: 'TimeGPT',
    dataTypes: [ { value: '1d', label: 'Ngày' }, { value: '1h', label: 'Giờ' } ],
    predLens: Array.from({ length: 56 }, (_, i) => i + 5),
    availableSymbols: allSymbols,
    isTrainable: false,
  },
  {
    value: 'TimeXer',
    label: 'TimeXer',
    dataTypes: [{ value: '1d', label: 'Ngày' }],
    predLens: [7, 14, 28],
    availableSymbols: trainableModelSymbols,
    isTrainable: true,
  },
  {
    value: 'Ensemble',
    label: 'Ensemble',
    dataTypes: [{ value: '1d', label: 'Ngày' }],
    predLens: [7, 14, 28],
    availableSymbols: trainableModelSymbols,
    isTrainable: true,
  },
];

// *** THAY ĐỔI LOGIC TẠI ĐÂY ***

// Key dùng chung cho các model có thể train
const TRAINABLE_MODELS_STORAGE_KEY = 'customPredLens_TrainableModels';

/**
 * Lấy danh sách tùy chỉnh từ localStorage.
 * Nếu là TimeXer hoặc Ensemble, sẽ dùng chung một key.
 */
export const getCustomPredLens = (modelName: string): number[] => {
  let storageKey = `customPredLens_${modelName}`;
  if (modelName === 'TimeXer' || modelName === 'Ensemble') {
    storageKey = TRAINABLE_MODELS_STORAGE_KEY;
  }
  
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Lỗi khi đọc localStorage:", error);
    return [];
  }
};

/**
 * Lưu tùy chỉnh mới vào localStorage.
 * Nếu là TimeXer hoặc Ensemble, sẽ dùng chung một key.
 */
export const saveCustomPredLen = (modelName: string, newLen: number) => {
  let storageKey = `customPredLens_${modelName}`;
  if (modelName === 'TimeXer' || modelName === 'Ensemble') {
    storageKey = TRAINABLE_MODELS_STORAGE_KEY;
  }

  const customLens = getCustomPredLens(modelName); // modelName ở đây vẫn đúng vì nó sẽ tự tìm đúng key
  
  if (!customLens.includes(newLen)) {
    const updatedLens = [...customLens, newLen].sort((a, b) => a - b);
    localStorage.setItem(storageKey, JSON.stringify(updatedLens));
  }
};
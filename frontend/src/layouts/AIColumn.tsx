import React from 'react';
import { AIPrediction } from '../components/AIPrediction';
import SavedPredictionsList from '../components/SavedPredictionsList';

interface PredictionResult {
  close: number;
  symbol: string;
  timestamp: string;
}

interface AIColumnProps {
    onPredict: (data: PredictionResult[] | null) => void;
    // Props để truyền xuống danh sách
    savedPredictions: PredictionResult[][];
    onSelectPrediction: (index: number) => void;
    onRemovePrediction: (index: number) => void;
    activePredictionIndex: number | null;
}

const AIColumn: React.FC<AIColumnProps> = (props) => {
  return (
    <aside className="w-96 bg-white shadow-lg h-full flex flex-col p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 px-2">Công cụ AI</h2>
        
        <AIPrediction onPredictionResult={props.onPredict} />
        
        <SavedPredictionsList 
            savedPredictions={props.savedPredictions}
            onSelectPrediction={props.onSelectPrediction}
            onRemovePrediction={props.onRemovePrediction}
            activePredictionIndex={props.activePredictionIndex}
        />
    </aside>
  );
};

export default AIColumn;
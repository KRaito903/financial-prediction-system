import React from 'react';
import { AIPrediction } from '../components/AIPrediction';

interface AIColumnProps {
    onPredict: (data: any[] | null) => void;
}

const AIColumn: React.FC<AIColumnProps> = ({ onPredict }) => {
  return (
    <aside className="w-96 bg-white shadow-lg h-full flex flex-col p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 px-2">Công cụ AI</h2>
        <AIPrediction onPredictionResult={onPredict} />
    </aside>
  );
};

export default AIColumn;
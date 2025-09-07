import React from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface PredictionResult {
  close: number;
  symbol: string;
  timestamp: string;
}

interface PredictionTabBarProps {
    savedPredictions: PredictionResult[][];
    onSelectPrediction: (index: number) => void;
    onRemovePrediction: (index: number) => void;
    activePredictionIndex: number | null;
}

const PredictionTabBar: React.FC<PredictionTabBarProps> = ({ 
    savedPredictions, 
    onSelectPrediction,
    onRemovePrediction,
    activePredictionIndex
}) => {
  if (savedPredictions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 p-2 flex items-center gap-2">
        {savedPredictions.map((prediction, index) => {
            const firstPoint = prediction[0];
            const label = `${index + 1}: ${firstPoint?.symbol || 'N/A'}`;

            return (
                <div key={index} className="relative group">
                    <Button 
                        onClick={() => onSelectPrediction(index)}
                        variant={activePredictionIndex === index ? "default" : "secondary"}
                        className="bg-black text-white hover:bg-gray-800 pr-8"
                    >
                       {label}
                    </Button>
                    <Button 
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 -translate-y-1/2 right-0 h-full w-8 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemovePrediction(index);
                        }}
                    >
                        <X className="h-4 w-4"/>
                    </Button>
                </div>
            )
        })}
    </div>
  );
};

export default PredictionTabBar;
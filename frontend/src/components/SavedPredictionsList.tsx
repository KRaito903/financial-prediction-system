import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, BarChartHorizontalBig } from 'lucide-react';

interface PredictionResult {
  close: number;
  symbol: string;
  timestamp: string;
}

interface SavedPredictionsListProps {
    savedPredictions: PredictionResult[][];
    onSelectPrediction: (index: number) => void;
    onRemovePrediction: (index: number) => void;
    activePredictionIndex: number | null;
}

const SavedPredictionsList: React.FC<SavedPredictionsListProps> = ({ 
    savedPredictions, 
    onSelectPrediction,
    onRemovePrediction,
    activePredictionIndex
}) => {
  if (savedPredictions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-lg">Các dự đoán đã lưu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            {savedPredictions.map((prediction, index) => {
                const firstPoint = prediction[0];
                const label = `${firstPoint?.symbol || 'N/A'} - Dự đoán ${prediction.length} kỳ`;

                return (
                    <div 
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer border transition-colors ${activePredictionIndex === index ? 'bg-muted border-primary' : 'hover:bg-muted/50'}`}
                        onClick={() => onSelectPrediction(index)}
                    >
                        <div className="flex items-center gap-3">
                           <BarChartHorizontalBig className="h-5 w-5 text-muted-foreground"/>
                           <span className="font-medium text-sm">{label}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation(); // Ngăn không cho event click vào div cha
                                onRemovePrediction(index);
                            }}
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                )
            })}
        </CardContent>
    </Card>
  );
};

export default SavedPredictionsList;
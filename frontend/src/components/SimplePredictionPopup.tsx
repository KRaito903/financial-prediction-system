import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PredictionChart from './PredictionChart';
import { Button } from './ui/button';
import { X, Minus } from 'lucide-react';

interface PredictionResult {
  close: number;
  symbol: string;
  timestamp: string;
}

interface SimplePredictionPopupProps {
    predictionData: PredictionResult[];
    onClose: () => void;
    onMinimize: () => void;
}

const SimplePredictionPopup: React.FC<SimplePredictionPopupProps> = ({ 
    predictionData,
    onClose,
    onMinimize,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popupRef.current) {
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = popupRef.current;
        setPosition({
            x: innerWidth - offsetWidth - 40,
            y: innerHeight - offsetHeight - 40
        });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !popupRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);

  return (
    <Card 
        ref={popupRef}
        className="fixed w-[600px] bg-white shadow-2xl z-50 border animate-in fade-in-0"
        style={{ top: position.y, left: position.x }}
    >
        <CardHeader 
            className="cursor-move flex flex-row items-center justify-between p-4 border-b"
            onMouseDown={handleMouseDown}
        >
            <CardTitle className="text-base">
                Kết quả dự đoán cho {predictionData[0]?.symbol}
            </CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
                    <Minus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-4">
          <PredictionChart predictionData={predictionData} />
        </CardContent>
    </Card>
  );
};

export default SimplePredictionPopup;
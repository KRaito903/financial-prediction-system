import React, { useRef, useState, useEffect } from 'react';
import { createChart, ColorType, type DeepPartial, CandlestickSeries } from 'lightweight-charts';
import Sidebar from '../layouts/Sidebar';
import MainContent from '../layouts/MainContent';

// --- PHẦN BỔ SUNG CHO TÍNH NĂNG AI ---
import AIColumn from '../layouts/AIColumn';
import SimplePredictionPopup from './SimplePredictionPopup';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';

// Định nghĩa kiểu dữ liệu cho kết quả dự đoán
interface PredictionResult {
  close: number;
  symbol: string;
  timestamp: string;
}


interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  symbol?: string;
  interval?: string;
}

export const ChartComponent = (props: {
  data: CandlestickData[], 
  colors?: {
    backgroundColor: string, 
    textColor: string, 
    upColor: string, 
    downColor: string, 
    borderVisible: DeepPartial<boolean> | undefined, 
    wickUpColor: string, 
    wickDownColor: string
  },
  height?: number
}) => {
  const { 
    data,
    height = 300,
    colors: {
      backgroundColor = 'white',
      textColor = 'black',
      upColor = '#26a69a',
      downColor = '#ef5350',
      borderVisible = false,
      wickUpColor = '#26a69a',
      wickDownColor = '#ef5350',
    } = {},
  } = props
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
          background: { type: ColorType.Solid, color: backgroundColor },
          textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: height || chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });
    
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    }
    
    chart.timeScale().fitContent();
    // @ts-ignore - Bỏ qua lỗi TypeScript có thể xảy ra do định nghĩa kiểu không chuẩn
    const newSeries = chart.addSeries(CandlestickSeries, { 
      upColor, 
      downColor, 
      borderVisible,
      wickUpColor,
      wickDownColor,
    });
    
    if (data && data.length > 0) {
      newSeries.setData(data as any);
    }

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
    };
  }, [data, backgroundColor, textColor, upColor, downColor, borderVisible, wickUpColor, wickDownColor, height])
  
  return (
    <div className="relative h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

const Dashboard: React.FC = () => {
  // --- PHẦN BỔ SUNG CHO TÍNH NĂNG AI ---
  const [savedPredictions, setSavedPredictions] = useState<PredictionResult[][]>([]);
  const [activePredictionIndex, setActivePredictionIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const storedPredictions = localStorage.getItem('savedAiPredictions');
      if (storedPredictions) {
        setSavedPredictions(JSON.parse(storedPredictions));
      }
    } catch (error) {
      console.error("Lỗi khi tải dự đoán từ localStorage", error);
    }
  }, []);

  const handlePrediction = (newData: PredictionResult[] | null) => {
    if (!newData) return;
    const newPredictions = [newData, ...savedPredictions].slice(0, 5);
    setSavedPredictions(newPredictions);
    localStorage.setItem('savedAiPredictions', JSON.stringify(newPredictions));
    setActivePredictionIndex(0); 
  };
  
  const handleRemovePrediction = (indexToRemove: number) => {
    const newPredictions = savedPredictions.filter((_, index) => index !== indexToRemove);
    setSavedPredictions(newPredictions);
    localStorage.setItem('savedAiPredictions', JSON.stringify(newPredictions));
    if (activePredictionIndex === indexToRemove) {
      setActivePredictionIndex(null);
    } else if (activePredictionIndex !== null && activePredictionIndex > indexToRemove) {
      setActivePredictionIndex(activePredictionIndex - 1);
    }
  };

  return (
    // THAY ĐỔI: Thêm `relative` để các pop-up định vị đúng
    <div className="h-screen bg-gray-100 flex relative">
      <Sidebar />
      <MainContent />

      {/* --- PHẦN BỔ SUNG CHO TÍNH NĂNG AI --- */}
      <AIColumn 
        onPredict={handlePrediction}
        savedPredictions={savedPredictions}
        onSelectPrediction={setActivePredictionIndex}
        onRemovePrediction={handleRemovePrediction}
        activePredictionIndex={activePredictionIndex}
      />
      {activePredictionIndex !== null && savedPredictions[activePredictionIndex] && (
        <SimplePredictionPopup
          predictionData={savedPredictions[activePredictionIndex]}
          onClose={() => handleRemovePrediction(activePredictionIndex)}
          onMinimize={() => setActivePredictionIndex(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
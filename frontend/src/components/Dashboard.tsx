import React, { useRef, useState } from 'react';
import { createChart, ColorType, type DeepPartial, CandlestickSeries } from 'lightweight-charts';
import Sidebar from '../layouts/Sidebar';
import MainContent from '../layouts/MainContent';
import AIColumn from '../layouts/AIColumn';
import SimplePredictionPopup from './SimplePredictionPopup';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2 } from 'lucide-react';

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
  } = props;
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
    };
    
    chart.timeScale().fitContent();
    // @ts-ignore - Bỏ qua lỗi TypeScript do thư viện có thể có định nghĩa kiểu không chính xác
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
  }, [data, backgroundColor, textColor, upColor, downColor, borderVisible, wickUpColor, wickDownColor, height]);
  
  return (
    <div className="relative h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [predictionData, setPredictionData] = useState<any[] | null>(null);
  const [isResultVisible, setIsResultVisible] = useState(false);

  // Hàm callback giờ chỉ cần 2 dòng
  const handlePrediction = (data: any[] | null) => {
    setPredictionData(data);
    setIsResultVisible(!!data); // Hiển thị nếu data có, ẩn nếu data là null
  };

  return (
    <div className="h-screen bg-gray-100 flex relative">
      <Sidebar />
      <MainContent />
      {/* Bỏ các props không cần thiết */}
      <AIColumn onPredict={handlePrediction} />

      {/* Pop-up kết quả (không đổi) */}
      {predictionData && isResultVisible && (
        <SimplePredictionPopup
          predictionData={predictionData}
          onClose={() => setPredictionData(null)}
          onMinimize={() => setIsResultVisible(false)}
        />
      )}

      {/* Nút mở lại pop-up (không đổi) */}
      {predictionData && !isResultVisible && (
        <Button 
            className="fixed bottom-4 right-4 z-50"
            onClick={() => setIsResultVisible(true)}
        >
            <BrainCircuit className="mr-2 h-4 w-4"/>
            Xem lại dự đoán
        </Button>
      )}
    </div>
  );
};

export default Dashboard;
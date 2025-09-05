import React, {useRef} from 'react';
import { CandlestickSeries, createChart, ColorType } from 'lightweight-charts';
import { type DeepPartial } from 'lightweight-charts';
import Sidebar from '../layouts/Sidebar';
import MainContent from '../layouts/MainContent';
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
  return (
    <div className="h-screen bg-gray-100 flex">
      <Sidebar />
      <MainContent />
    </div>
  );
};

export default Dashboard;
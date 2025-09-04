import React, {useRef} from 'react';
import { useSocket } from '../context/SocketContext';
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
export const ChartComponent = (props: {data: CandlestickData[], colors?: {backgroundColor: string, textColor: string, upColor: string, downColor: string, borderVisible: DeepPartial<boolean> | undefined, wickUpColor: string, wickDownColor:string }}) => {
  const { data,
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
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    }
    chart.timeScale().fitContent();
    const newSeries = chart.addSeries(CandlestickSeries, { 
      upColor, 
      downColor, 
      borderVisible,
      wickUpColor,
      wickDownColor,
    });
    newSeries.setData(data as any);

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);

        chart.remove();
    };
  }, [data, backgroundColor, textColor, upColor, downColor, borderVisible, wickUpColor, wickDownColor])
  
  return (
    <div className="relative">
      <div ref={chartContainerRef} />
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { connected, candlestickData, error, currentMarket, subscribeToMarket, fetchHistoricalData, loading } = useSocket();

  return (
    <div className="h-screen bg-gray-100 flex">
      <Sidebar 
        currentMarket={currentMarket}
        onMarketChange={subscribeToMarket}
        loading={loading}
        connected={connected}
      />
      <MainContent 
        candlestickData={candlestickData}
        currentMarket={currentMarket}
        error={error}
        loading={loading}
        onTimeRangeSelect={fetchHistoricalData}
      />
    </div>
  );
};

export default Dashboard;
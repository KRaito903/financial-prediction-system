import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PredictionResult {
  close: number;
  symbol: string;
  timestamp: string; 
}

interface PredictionChartProps {
  predictionData: PredictionResult[];
}

const PredictionChart: React.FC<PredictionChartProps> = ({ predictionData }) => {

  // --- LOGIC MỚI: TỰ ĐỘNG PHÁT HIỆN ĐỊNH DẠNG THỜI GIAN ---
  const isHourly = React.useMemo(() => {
    if (predictionData.length < 2) {
      return false; // Mặc định là ngày nếu không đủ dữ liệu để so sánh
    }
    const date1 = new Date(predictionData[0].timestamp);
    const date2 = new Date(predictionData[1].timestamp);
    
    // Tính khoảng cách giữa 2 điểm dữ liệu (tính bằng giờ)
    const differenceInHours = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
    
    // Nếu khoảng cách nhỏ hơn 24 giờ, ta coi đó là dữ liệu theo giờ
    return differenceInHours < 24;
  }, [predictionData]);

  const chartData = predictionData.map(p => {
    const date = new Date(p.timestamp);
    // Áp dụng định dạng phù hợp
    const timeFormat = isHourly 
      ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });

    return {
      time: timeFormat,
      'Giá dự đoán': p.close,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={['auto', 'auto']} allowDataOverflow={true} />
        <Tooltip 
          formatter={(value: number) => [value.toLocaleString('en-US'), 'Giá']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Giá dự đoán"
          stroke="#82ca9d"
          strokeWidth={2}
          dot={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PredictionChart;
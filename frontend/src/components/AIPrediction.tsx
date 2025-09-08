import React, { useState, useEffect, useMemo } from 'react';
import { useLazyQuery } from '@apollo/client';
import { PREDICT_MODEL } from '@/lib/queries';
import { baseModelConfigs, getCustomPredLens, saveCustomPredLen, type ModelOption } from '@/lib/modelConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Loader2, HelpCircle } from 'lucide-react';
import { CHECK_MODEL_STATUS } from '@/lib/queries';

interface AIPredictionProps {
    onPredictionResult: (data: any[] | null) => void;
}

export const AIPrediction: React.FC<AIPredictionProps> = ({ onPredictionResult }) => {
  const [selectedModelValue, setSelectedModelValue] = useState<string>(baseModelConfigs[0].value);
  const [configVersion, setConfigVersion] = useState(0);

  const modelOptions = useMemo<ModelOption[]>(() => {
    return baseModelConfigs.map(config => {
      const customLens = getCustomPredLens(config.value);
      return { ...config, predLens: [...new Set([...config.predLens, ...customLens])].sort((a, b) => a - b) };
    });
  }, [configVersion]);

  const selectedModel = useMemo(() => {
    return modelOptions.find(m => m.value === selectedModelValue);
  }, [selectedModelValue, modelOptions]);

  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [dataType, setDataType] = useState<string>('');
  const [predLen, setPredLen] = useState<string>('');
  const [customPredLen, setCustomPredLen] = useState('');
  const [uiStatus, setUiStatus] = useState<'idle' | 'predicting' | 'training'>('idle');

  useEffect(() => {
    if (selectedModel) {
        setSelectedSymbol(selectedModel.availableSymbols[0] || '');
        setDataType(selectedModel.dataTypes[0]?.value || '');
        setPredLen(selectedModel.predLens[0]?.toString() || '');
    }
  }, [selectedModel]);

  const [predict, { loading }] = useLazyQuery(PREDICT_MODEL, {
    onCompleted: (data) => {
      onPredictionResult(data.predictModel);
      toast.success('Dữ liệu dự đoán đã sẵn sàng!');
      setUiStatus('idle');
    },
    onError: (error) => {
      onPredictionResult(null);
      toast.error(`Lỗi khi dự đoán: ${error.message}`);
      setUiStatus('idle');
    },
  });

  const [checkStatus, { loading: checkLoading }] = useLazyQuery(CHECK_MODEL_STATUS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data.checkModel === true) {
        toast.success('Model đã sẵn sàng! Bạn có thể thử dự đoán lại.');
      } else {
        toast.error('Model vẫn đang được xử lý hoặc không tồn tại.');
      }
    },
    onError: (error) => toast.error(`Lỗi khi kiểm tra: ${error.message}`),
  });

  const handlePredict = () => {
    if (!selectedModel) return;
    onPredictionResult(null);
    const len = parseInt(predLen === 'custom' ? customPredLen : predLen, 10);
    if (isNaN(len) || len <= 0) {
      toast.error('Vui lòng nhập một khoảng thời gian hợp lệ.');
      return;
    }
    const isCustom = !baseModelConfigs.find(m => m.value === selectedModel.value)?.predLens.includes(len);
    if (isCustom && selectedModel.isTrainable) {
        saveCustomPredLen(selectedModel.value, len);
        toast.success(`Đã lưu tùy chỉnh ${len} cho model ${selectedModel.label}`);
        setConfigVersion(v => v + 1);
    }
    setUiStatus(selectedModel.isTrainable && isCustom ? 'training' : 'predicting');
    predict({ variables: { datatype: dataType, modelName: selectedModel.value, predLen: len, symbol: selectedSymbol } });
  };

  const handleCheckStatus = () => {
    if (!selectedModel) return;
    const len = parseInt(predLen === 'custom' ? customPredLen : predLen, 10);
    if (isNaN(len) || len <= 0) {
      toast.error('Vui lòng chọn hoặc nhập một khoảng thời gian hợp lệ để kiểm tra.');
      return;
    }
    toast('Đang kiểm tra trạng thái model...');
    checkStatus({ variables: { modelName: selectedModel.value, predLen: len } });
  };

  const getButtonText = () => {
    if (loading) {
        if (uiStatus === 'training') return 'Đang Training & Dự đoán...';
        return 'Đang dự đoán...';
    }
    return 'Dự đoán';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Prediction</CardTitle>
        <CardDescription>Chọn các tham số để dự đoán.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={selectedModelValue} onValueChange={setSelectedModelValue}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (<SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {selectedModel && (
            <>
              <div className="space-y-2">
                <Label>Đồng Coin</Label>
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectedModel.availableSymbols.map((symbol) => (<SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Loại thời gian</Label>
                <Select value={dataType} onValueChange={setDataType} disabled={selectedModel.dataTypes.length === 1}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectedModel.dataTypes.map((dt) => (<SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Khoảng thời gian dự đoán</Label>
                <Select value={predLen} onValueChange={setPredLen}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectedModel.predLens.map((len) => (<SelectItem key={len} value={len.toString()}>{len} {dataType === '1d' ? 'ngày' : 'giờ'}</SelectItem>))}
                    {selectedModel.isTrainable && (<SelectItem value="custom">Tùy chỉnh...</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {predLen === 'custom' && selectedModel.isTrainable && (
                <div className="space-y-2">
                  <Label>Nhập khoảng thời gian tùy chỉnh</Label>
                  <Input type="number" value={customPredLen} onChange={(e) => setCustomPredLen(e.target.value)} />
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-2">
            <Button onClick={handlePredict} disabled={loading || checkLoading || !selectedModel} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getButtonText()}
            </Button>
            {selectedModel?.isTrainable && (
              <Button variant="outline" size="icon" onClick={handleCheckStatus} disabled={loading || checkLoading} title="Kiểm tra trạng thái model">
                {checkLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <HelpCircle className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
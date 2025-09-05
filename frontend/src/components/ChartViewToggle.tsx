import React from 'react';
import { Grid3X3, SquareStack } from 'lucide-react';
import { Button } from './ui/button';
import type { ViewMode } from '../types/chart';

interface ChartViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  loading?: boolean;
}

const ChartViewToggle: React.FC<ChartViewToggleProps> = ({ 
  currentView, 
  onViewChange, 
  loading = false 
}) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      <Button
        variant={currentView === 'single' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('single')}
        disabled={loading}
        className={`flex items-center space-x-2 px-3 py-1.5 ${
          currentView === 'single'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <SquareStack className="h-4 w-4" />
        <span className="text-sm font-medium">Single</span>
      </Button>
      <Button
        variant={currentView === 'multi' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('multi')}
        disabled={loading}
        className={`flex items-center space-x-2 px-3 py-1.5 ${
          currentView === 'multi'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="text-sm font-medium">Multi</span>
      </Button>
    </div>
  );
};

export default ChartViewToggle;
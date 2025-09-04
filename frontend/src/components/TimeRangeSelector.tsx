import React, { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

export interface TimeRange {
  startTime: Date;
  endTime: Date;
}

interface TimeRangeSelectorProps {
  onTimeRangeSelect: (timeRange: TimeRange) => void;
  loading?: boolean;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  onTimeRangeSelect,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [selectedRange, setSelectedRange] = useState<{from: Date, to: Date} | undefined>();

  const handleDateRangeSelect = (range: any) => {
    if (range?.from && range?.to) {
      setSelectedRange(range);
      setStartDate(range.from);
      setEndDate(range.to);
    }
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) return;

    // Parse time strings and combine with dates
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    onTimeRangeSelect({
      startTime: startDateTime,
      endTime: endDateTime
    });

    setIsOpen(false);
  };

  const isValidRange = startDate && endDate && startDate <= endDate;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Time Range
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Time Range</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6">
          {/* Calendar Section */}
          <div className="flex-1">
            <div className="mb-4">
              <Label className="text-sm font-medium">Select Date Range</Label>
            </div>
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              className="rounded-md border"
              disabled={(date) => date > new Date()}
            />
          </div>

          {/* Time Selection Section */}
          <div className="w-80 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Start Date & Time</Label>
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-gray-600">
                    {startDate ? format(startDate, 'yyyy-MM-dd') : 'Select start date'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">End Date & Time</Label>
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-gray-600">
                    {endDate ? format(endDate, 'yyyy-MM-dd') : 'Select end date'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <Label className="text-sm font-medium">Selected Range</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <span className="font-medium">From:</span>{' '}
                  {startDate && startTime 
                    ? `${format(startDate, 'MMM dd, yyyy')} ${startTime}`
                    : 'Not selected'
                  }
                </div>
                <div>
                  <span className="font-medium">To:</span>{' '}
                  {endDate && endTime 
                    ? `${format(endDate, 'MMM dd, yyyy')} ${endTime}`
                    : 'Not selected'
                  }
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!isValidRange || loading}
                className="flex-1"
              >
                {loading ? 'Loading...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeRangeSelector;
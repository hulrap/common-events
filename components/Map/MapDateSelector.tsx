import { useState, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

const DATE_PRESETS = {
  today: { label: 'Today', value: 'today' as const },
  tomorrow: { label: 'Tomorrow', value: 'tomorrow' as const },
  week: { label: 'This Week', value: 'week' as const },
  month: { label: 'This Month', value: 'month' as const },
} as const;

export function MapDateSelector() {
  const { filters, updateFilters } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Local state for calendar selection to provide immediate feedback
  const [localRange, setLocalRange] = useState<DateRange | undefined>(undefined);

  // Sync local range with filter state
  useEffect(() => {
    if (filters.dateRange.start || filters.dateRange.end) {
      setLocalRange({
        from: filters.dateRange.start,
        to: filters.dateRange.end,
      });
    } else {
      setLocalRange(undefined);
    }
  }, [filters.dateRange.start, filters.dateRange.end]);

  const currentPreset = filters.dateRange.preset ?? undefined;
  const hasDateFilter = filters.dateRange.start || filters.dateRange.end;

  const handlePresetClick = (preset: 'today' | 'tomorrow' | 'week' | 'month') => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today': {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'tomorrow': {
        start = new Date(tomorrow);
        start.setHours(0, 0, 0, 0);
        end = new Date(tomorrow);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'week': {
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'month': {
        start.setHours(0, 0, 0, 0);
        end = new Date(today);
        end.setMonth(end.getMonth() + 1);
        end.setHours(23, 59, 59, 999);
        break;
      }
    }

    updateFilters({
      dateRange: { preset, start, end },
    });
    setShowCalendar(false);
  };

  const handleClearDate = () => {
    updateFilters({
      dateRange: { preset: undefined, start: undefined, end: undefined },
    });
    setLocalRange(undefined);
    setIsOpen(false);
  };

  const handleCustomSelect = (range: DateRange | undefined) => {
    // Update local state immediately for visual feedback
    setLocalRange(range);

    if (range?.from) {
      const start = new Date(range.from);
      start.setHours(0, 0, 0, 0);

      // If we have both from and to, update the filter
      if (range.to) {
        const end = new Date(range.to);
        end.setHours(23, 59, 59, 999);
        updateFilters({
          dateRange: { preset: 'custom', start, end },
        });
      } else {
        // Just from selected - show as single day for now
        const end = new Date(range.from);
        end.setHours(23, 59, 59, 999);
        updateFilters({
          dateRange: { preset: 'custom', start, end },
        });
      }
    }
  };

  const handleClearSelection = () => {
    setLocalRange(undefined);
    updateFilters({
      dateRange: { preset: 'custom', start: undefined, end: undefined },
    });
  };

  const getDisplayText = () => {
    if (!hasDateFilter || !filters.dateRange.start) return 'Select dates...';
    const startStr = format(filters.dateRange.start, 'MMM d');
    if (!filters.dateRange.end || filters.dateRange.start.getTime() === filters.dateRange.end.getTime()) {
      return startStr;
    }
    return `${startStr} - ${format(filters.dateRange.end, 'MMM d')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${hasDateFilter
            ? 'bg-white text-black border-white'
            : 'bg-black border-white/10 grain-texture header-glass text-slate-200 hover:bg-black/80'
            }`}
          title="Date range filter"
        >
          <Calendar className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end" sideOffset={8}>
        <div className="p-4 space-y-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Date Range</h3>
            {hasDateFilter && (
              <button
                onClick={handleClearDate}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* Preset buttons */}
          <div className="grid grid-cols-2 gap-2">
            {Object.values(DATE_PRESETS).map(preset => (
              <Button
                key={preset.value}
                variant={currentPreset === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick(preset.value)}
                className={`text-xs ${currentPreset === preset.value
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'border-white/20 text-white hover:bg-white/10'
                  }`}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            className={`w-full text-xs border-white/20 text-white hover:bg-white/10 ${showCalendar || currentPreset === 'custom' ? 'bg-white/10' : ''
              }`}
          >
            {getDisplayText()}
          </Button>

          {/* Calendar */}
          {showCalendar && (
            <div className="border-t border-white/10 pt-4">
              {/* Clear selection button when range is selected */}
              {localRange?.from && (
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                  <span className="text-xs text-white/70">
                    {localRange.to && localRange.from.getTime() !== localRange.to.getTime()
                      ? `${format(localRange.from, 'MMM d')} - ${format(localRange.to, 'MMM d')}`
                      : format(localRange.from, 'MMM d')}
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Change
                  </button>
                </div>
              )}

              <div className="[&_.rdp]:text-white [&_.rdp-weekday]:text-white/60 [&_.rdp-caption_label]:text-white [&_.rdp-button_previous]:text-white [&_.rdp-button_next]:text-white [&_.rdp-selected]:bg-white [&_.rdp-selected]:text-black [&_.rdp-range_middle]:bg-white/20 [&_.rdp-today]:ring-1 [&_.rdp-today]:ring-white/50 [&_.rdp-day_button:hover]:bg-white/10 [&_.rdp-range_start]:bg-white [&_.rdp-range_start]:text-black [&_.rdp-range_end]:bg-white [&_.rdp-range_end]:text-black">
                <CalendarComponent
                  mode="range"
                  selected={localRange}
                  onSelect={handleCustomSelect}
                  disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  numberOfMonths={1}
                />
              </div>

              {/* Help text */}
              <p className="text-xs text-white/40 mt-2">
                Click a start date, then click an end date
              </p>
            </div>
          )}

          {/* Current selection display */}
          {hasDateFilter && filters.dateRange.start && !showCalendar && (
            <div className="text-xs text-white/50 pt-2 border-t border-white/10">
              <p>{format(filters.dateRange.start, 'EEEE, MMM d, yyyy')}</p>
              {filters.dateRange.end &&
                filters.dateRange.start.getTime() !== filters.dateRange.end.getTime() && (
                  <p>to {format(filters.dateRange.end, 'EEEE, MMM d, yyyy')}</p>
                )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

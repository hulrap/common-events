import { useState } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useConfig } from '@/hooks/useConfig';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Settings } from 'lucide-react';

export function MapFilterLegend() {
  const { filters, updateFilters, resetFilters } = useFilters();
  const { categories } = useConfig();
  const [showPanel, setShowPanel] = useState(false);

  const activeFilterCount =
    filters.categories.length +
    (filters.onlineOnly ? 1 : 0) +
    (filters.editorsChoiceOnly ? 1 : 0);

  const handleCategoryToggle = (categoryId: string) => {
    const updatedCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];

    updateFilters({ categories: updatedCategories });
  };

  const handleEditorChoiceToggle = () => {
    updateFilters({
      editorsChoiceOnly: !filters.editorsChoiceOnly,
    });
  };

  const handleOnlyOnlineToggle = () => {
    updateFilters({
      onlineOnly: !filters.onlineOnly,
    });
  };

  return (
    <Popover open={showPanel} onOpenChange={setShowPanel}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black border border-white/10 grain-texture header-glass text-slate-200 hover:bg-black/80 transition-colors"
          title="Filter options"
        >
          <Settings className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={() => resetFilters()}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Categories</div>
            <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={() =>
                      handleCategoryToggle(category.id)
                    }
                    style={
                      filters.categories.includes(category.id)
                        ? {
                          backgroundColor: category.color,
                          borderColor: category.color,
                        }
                        : {}
                    }
                  />
                  <Label
                    htmlFor={`cat-${category.id}`}
                    className="text-sm cursor-pointer font-normal"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-2 pt-3 border-t">
            <div className="text-sm font-medium">Event Type</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editors-choice"
                  checked={filters.editorsChoiceOnly}
                  onCheckedChange={handleEditorChoiceToggle}
                />
                <Label
                  htmlFor="editors-choice"
                  className="text-sm cursor-pointer font-normal"
                >
                  Editor&apos;s Choice Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online-only"
                  checked={filters.onlineOnly}
                  onCheckedChange={handleOnlyOnlineToggle}
                />
                <Label
                  htmlFor="online-only"
                  className="text-sm cursor-pointer font-normal"
                >
                  Online Only
                </Label>
              </div>
            </div>
          </div>

          {/* Info text */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Filters update the map in real-time
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

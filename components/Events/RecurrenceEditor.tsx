import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface RecurrenceEditorProps {
  readonly recurrence: any;
  readonly onChange: (recurrence: any) => void;
}

export function RecurrenceEditor({ recurrence, onChange }: RecurrenceEditorProps) {
  const [enabled, setEnabled] = useState(!!recurrence);

  const updateRecurrence = (field: string, value: any) => {
    if (!enabled) {
      onChange(null);
      return;
    }

    onChange({
      recurrenceType: recurrence?.recurrenceType || "weekly",
      interval: recurrence?.interval || 1,
      daysOfWeek: recurrence?.daysOfWeek || [],
      ...recurrence,
      [field]: value,
    });
  };

  const toggleDay = (day: number) => {
    const days = recurrence?.daysOfWeek || [];
    const newDays = days.includes(day)
      ? days.filter((d: number) => d !== day)
      : [...days, day];
    updateRecurrence("daysOfWeek", newDays);
  };

  if (!enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurring"
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked as boolean);
              if (checked) {
                onChange({
                  recurrenceType: "weekly",
                  interval: 1,
                  daysOfWeek: [],
                });
              } else {
                onChange(null);
              }
            }}
          />
          <Label htmlFor="recurring">This is a recurring event</Label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recurring"
          checked={enabled}
          onCheckedChange={(checked) => {
            setEnabled(checked as boolean);
            if (!checked) {
              onChange(null);
            }
          }}
        />
        <Label htmlFor="recurring">This is a recurring event</Label>
      </div>
      <div>
        <Label className="text-white">Recurrence Type</Label>
        <Select
          value={recurrence?.recurrenceType || "weekly"}
          onValueChange={(value) => updateRecurrence("recurrenceType", value)}
        >
          <SelectTrigger className="mt-2 bg-black/40 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-white">Interval</Label>
        <Input
          type="number"
          min="1"
          value={recurrence?.interval || 1}
          onChange={(e) =>
            updateRecurrence("interval", Number.parseInt(e.target.value, 10) || 1)
          }
          className="mt-2 bg-black/40 border-white/10 text-white"
        />
      </div>
      {(recurrence?.recurrenceType === "weekly" ||
        recurrence?.recurrenceType === "custom") && (
        <div>
          <Label className="text-white">Days of Week</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={
                    recurrence?.daysOfWeek?.includes(index) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleDay(index)}
                  className={
                    recurrence?.daysOfWeek?.includes(index)
                      ? "bg-brand-orange hover:bg-brand-oredge text-white border-0"
                      : "bg-black/40 border-white/20 text-white hover:bg-black/60"
                  }
                >
                  {day}
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}


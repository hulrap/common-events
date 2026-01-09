import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createEventSchema } from "@/lib/validations/event.schema";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { apiFetch } from '@/lib/api-client';
import { EventForm } from "./EventForm";

interface CreateEventModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      const createdEvent = await response.json();
      setEventId(createdEvent.id);

      toast.success("Event created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
    router.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details to create your event
          </DialogDescription>
        </DialogHeader>

        {eventId ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-green-500 text-xl font-semibold">Event Created!</div>
            <p className="text-slate-400">Your event has been successfully created.</p>
            <Button onClick={handleFinish}>Done</Button>
          </div>
        ) : (
          <EventForm
            schema={createEventSchema}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            submitLabel="Create Event"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}


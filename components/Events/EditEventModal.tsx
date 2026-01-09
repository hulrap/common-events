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
import { updateEventSchema } from "@/lib/validations/event.schema";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { apiFetch } from '@/lib/api-client';
import { EventForm } from "./EventForm";

interface EditEventModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly eventId: string;
}

export function EditEventModal({ open, onOpenChange, eventId }: EditEventModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    if (open && eventId) {
      const loadEvent = async () => {
        try {
          setLoading(true);
          const response = await apiFetch(`/api/events/${eventId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch event");
          }

          const data = await response.json();

          // Format dates for input
          const formatDateForInput = (date: string | Date) => {
            if (!date) return "";
            const d = typeof date === 'string' ? new Date(date) : date;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          };

          // Prepare default values
          const formattedData = {
            ...data,
            startDate: formatDateForInput(data.startDate),
            endDate: formatDateForInput(data.endDate),
            registrationDeadline: data.registrationDeadline ? formatDateForInput(data.registrationDeadline) : null,
            venueId: data.venueId || "",
            customVenueName: data.customLocation || "", // Map customLocation to customVenueName for form
            // Ensure arrays are initialized
            tickets: data.tickets || [],
            tags: data.tags || [],
            // Ensure strings are not null
            description: data.description || "",

            eventUrl: data.eventUrl || "",
            organizerName: data.organizerName || "",
            organizerContact: data.organizerContact || "",
            sourceUrl: data.sourceUrl || "",
            externalLink: data.externalLink || "",
            externalLinkText: data.externalLinkText || "",
            ageRestriction: data.ageRestriction || "",
            dressCode: data.dressCode || "",
            language: data.language || "",
            accessibilityNotes: data.accessibilityNotes || "",
            parkingInfo: data.parkingInfo || "",
            publicTransportInfo: data.publicTransportInfo || "",
          };

          setEventData(formattedData);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load event");
          onOpenChange(false);
        } finally {
          setLoading(false);
        }
      };
      loadEvent();
    }
  }, [open, eventId, onOpenChange]);

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const response = await apiFetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update event");
      }

      toast.success("Event updated successfully!");
      onOpenChange(false);
      router.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            zIndex: 100
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Loading Event</DialogTitle>
            <DialogDescription className="text-white/70">
              Please wait while we load the event details...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-white/70">Loading event...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          zIndex: 100
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Edit Event</DialogTitle>
          <DialogDescription className="text-white/70">
            Update the details of your event
          </DialogDescription>
        </DialogHeader>

        <EventForm
          schema={updateEventSchema}
          defaultValues={eventData}
          onSubmit={onSubmit}
          isSubmitting={submitting}
          onCancel={() => onOpenChange(false)}
          submitLabel="Update Event"
        />
      </DialogContent>
    </Dialog>
  );
}

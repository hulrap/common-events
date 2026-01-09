import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig } from "@/hooks/useConfig";
import { Plus, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Ticket {
  id: string;
  ticketName: string;
  price?: number | null;
  currency: string;
  ticketLink?: string;
  description?: string;
  quantityAvailable?: number | null;
}

interface TicketManagerProps {
  readonly tickets: readonly Ticket[];
  readonly onChange: (tickets: Ticket[]) => void;
}

interface TicketItemProps {
  readonly ticket: Ticket;
  readonly currencies: Array<{ code: string; symbol: string }>;
  readonly onRemove: (id: string) => void;
  readonly onUpdate: (id: string, field: keyof Ticket, value: any) => void;
  readonly dragHandleProps: any;
  readonly draggableProps: any;
  readonly innerRef: (element: HTMLElement | null) => void;
}

function TicketItem({
  ticket,
  currencies,
  onRemove,
  onUpdate,
  dragHandleProps,
  draggableProps,
  innerRef,
}: TicketItemProps) {
  const handleTicketNameChange = (value: string) => {
    onUpdate(ticket.id, "ticketName", value);
  };

  const handlePriceChange = (value: string) => {
    const price = value ? Number.parseFloat(value) : null;
    onUpdate(ticket.id, "price", price);
  };

  const handleCurrencyChange = (value: string) => {
    onUpdate(ticket.id, "currency", value);
  };

  const handleTicketLinkChange = (value: string) => {
    onUpdate(ticket.id, "ticketLink", value);
  };

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className="border rounded-md p-4 space-y-4"
    >
      <div className="flex justify-between items-start">
        <div {...dragHandleProps} className="cursor-move">
          ⋮⋮
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(ticket.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <Label>Ticket Name *</Label>
        <Input
          value={ticket.ticketName}
          onChange={(e) => handleTicketNameChange(e.target.value)}
          placeholder="e.g., General Admission"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price</Label>
          <Input
            type="number"
            step="0.01"
            value={ticket.price || ""}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>Currency</Label>
          <Select
            value={ticket.currency}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Ticket Link</Label>
        <Input
          value={ticket.ticketLink || ""}
          onChange={(e) => handleTicketLinkChange(e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

export function TicketManager({ tickets, onChange }: TicketManagerProps) {
  const { currencies } = useConfig();

  const addTicket = () => {
    onChange([
      ...tickets,
      {
        id: Date.now().toString(),
        ticketName: "",
        currency: "EUR",
      },
    ]);
  };

  const removeTicket = (id: string) => {
    onChange(tickets.filter((t) => t.id !== id));
  };

  const updateTicket = (id: string, field: keyof Ticket, value: any) => {
    onChange(
      tickets.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(tickets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Tickets</Label>
        <Button type="button" onClick={addTicket} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket
        </Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tickets">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {tickets.map((ticket, index) => (
                <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                  {(draggableProvided) => (
                    <TicketItem
                      ticket={ticket}
                      currencies={currencies}
                      onRemove={removeTicket}
                      onUpdate={updateTicket}
                      dragHandleProps={draggableProvided.dragHandleProps}
                      draggableProps={draggableProvided.draggableProps}
                      innerRef={draggableProvided.innerRef}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}


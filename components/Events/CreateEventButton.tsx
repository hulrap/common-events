import { useState } from "react";
import { CreateEventModal } from "./CreateEventModal";
import { Plus } from "lucide-react";

export function CreateEventButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>
      <CreateEventModal open={open} onOpenChange={setOpen} />
    </>
  );
}

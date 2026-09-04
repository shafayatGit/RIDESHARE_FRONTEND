import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/date-picker-input";
import { CalendarDays, Leaf, MapPin, Send } from "lucide-react";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 text-center">
      <Badge variant="eco" className="mb-4 gap-1">
        <Leaf className="h-3 w-3" />
        Eco-friendly campus travel
      </Badge>

      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl xl:text-7xl">
        Share the Ride, <span className="text-primary">Save the Planet.</span>
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        Connect with fellow students, reduce your campus carbon footprint, and
        split fuel costs. Reliable carpooling built specifically for our
        academic community.
      </p>

      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-full border bg-background p-2 shadow-sm sm:flex-row sm:items-center">
        <Input
          startIcon={MapPin}
          placeholder="From"
          className="border-0 shadow-none focus-visible:ring-0"
        />
        <div className="hidden h-6 w-px bg-border sm:block" />
        <Input
          startIcon={Send}
          placeholder="To"
          className="border-0 shadow-none focus-visible:ring-0"
        />
        <div className="hidden h-6 w-px bg-border sm:block" />
        <Input
          type="date"
          startIcon={CalendarDays}
          className="border-0 shadow-none focus-visible:ring-0 cursor-pointer"
        />
        <Button className="rounded-full px-6">Find a Ride</Button>
      </div>
    </section>
  );
}

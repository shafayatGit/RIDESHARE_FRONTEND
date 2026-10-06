"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, MapPin, Send, CalendarDays } from "lucide-react";
import * as React from "react";
import { api, ApiError } from "@/lib/api";
import type { Ride } from "@/lib/types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [date, setDate] = React.useState<string>("");

  React.useEffect(() => {
    api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load rides",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const uniqueFrom = React.useMemo(() => {
    const set = new Set(rides.map((r) => r.originAddress.trim()));
    return Array.from(set).sort();
  }, [rides]);

  const uniqueTo = React.useMemo(() => {
    const set = new Set(rides.map((r) => r.destinationAddress.trim()));
    return Array.from(set).sort();
  }, [rides]);

  const uniqueDates = React.useMemo(() => {
    const set = new Set(
      rides.map((r) => format(new Date(r.departureTime), "yyyy-MM-dd")),
    );
    return Array.from(set).sort();
  }, [rides]);

  const handleFindRide = () => {
    const params = new URLSearchParams();
    if (from && from !== "__all__") params.set("from", from);
    if (to && to !== "__all__") params.set("to", to);
    if (date && date !== "__all__") params.set("date", date);
    router.push(`/find${params.toString() ? `?${params.toString()}` : ""}`);
  };

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
        <div className="flex w-full items-center gap-2 px-2 sm:w-auto sm:flex-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Select value={from} onValueChange={setFrom} disabled={isLoading}>
            <SelectTrigger className="w-full border-0 shadow-none focus-visible:ring-0">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectItem value="__all__">All Locations</SelectItem>
              {uniqueFrom.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex w-full items-center gap-2 px-2 sm:w-auto sm:flex-1">
          <Send className="h-4 w-4 text-muted-foreground" />
          <Select value={to} onValueChange={setTo} disabled={isLoading}>
            <SelectTrigger className="w-full border-0 shadow-none focus-visible:ring-0">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectItem value="__all__">All Destinations</SelectItem>
              {uniqueTo.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex w-full items-center gap-2 px-2 sm:w-auto sm:flex-1">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={date} onValueChange={setDate} disabled={isLoading}>
            <SelectTrigger className="w-full border-0 shadow-none focus-visible:ring-0">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectItem value="__all__">Any Date</SelectItem>
              {uniqueDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {format(new Date(d), "MMM d, yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="rounded-full px-6"
          onClick={handleFindRide}
          disabled={isLoading}
        >
          Find a Ride
        </Button>
      </div>
    </section>
  );
}

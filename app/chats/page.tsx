"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatTime } from "@/lib/format";
import { getSocket } from "@/lib/socket";
import type { ChatMessage, Ride } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessageSquare, Search, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";

const quickReplies = ["I'm at the pickup point", "Running 5 mins late", "Where exactly are you?", "Thanks!"];

function ChatsContent() {
  const { user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const requestedRideId = searchParams.get("ride");

  const [rides, setRides] = React.useState<Ride[]>([]);
  const [selectedRideId, setSelectedRideId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [search, setSearch] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user) return;
    api
      .get<Ride[]>("/ride")
      .then(async (allRides) => {
        let myRides = allRides.filter((r) => r.driverId === user.id);
        if (requestedRideId && !myRides.some((r) => r.id === requestedRideId)) {
          try {
            const extra = await api.get<Ride>(`/ride/${requestedRideId}`);
            myRides = [extra, ...myRides];
          } catch {
            // ride no longer exists — ignore
          }
        }
        setRides(myRides);
        setSelectedRideId(requestedRideId ?? myRides[0]?.id ?? null);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load ride chats"));
  }, [user, requestedRideId]);

  React.useEffect(() => {
    if (!accessToken || !selectedRideId) return;

    const socket = getSocket(accessToken);

    const onMessagesLoad = (loaded: ChatMessage[]) => setMessages(loaded);
    const onMessageNew = (message: ChatMessage) => {
      if (message.rideId === selectedRideId) setMessages((prev) => [...prev, message]);
    };
    const onError = (err: { message: string }) => toast.error(err.message);
    const onConnectError = (err: Error) => toast.error(`Chat connection failed: ${err.message}`);

    socket.on("messages:load", onMessagesLoad);
    socket.on("message:new", onMessageNew);
    socket.on("error", onError);
    socket.on("connect_error", onConnectError);

    socket.emit("ride:join", { rideId: selectedRideId });

    return () => {
      socket.off("messages:load", onMessagesLoad);
      socket.off("message:new", onMessageNew);
      socket.off("error", onError);
      socket.off("connect_error", onConnectError);
    };
  }, [accessToken, selectedRideId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content: string) => {
    if (!accessToken || !selectedRideId || !content.trim()) return;
    const socket = getSocket(accessToken);
    socket.emit("message:send", { rideId: selectedRideId, content: content.trim() });
    setDraft("");
  };

  const selectedRide = rides.find((r) => r.id === selectedRideId);
  const filteredRides = rides.filter((r) =>
    `${r.originAddress} ${r.destinationAddress}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl gap-4 px-4 py-4">
      <Card className="flex w-72 shrink-0 flex-col gap-0 overflow-hidden p-0">
        <div className="border-b p-3">
          <h2 className="mb-2 font-medium">Ride Chats</h2>
          <Input
            startIcon={Search}
            placeholder="Search coordination chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-1">
          {filteredRides.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {rides.length === 0
                ? "You'll see chats here once you post or join a ride."
                : "No chats match your search."}
            </div>
          ) : (
            filteredRides.map((ride) => (
              <button
                key={ride.id}
                onClick={() => setSelectedRideId(ride.id)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b p-3 text-left text-sm transition-colors hover:bg-muted/50",
                  selectedRideId === ride.id && "bg-accent/30",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {ride.originAddress} to {ride.destinationAddress}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ride.driverId === user?.id ? "You're driving" : `Driver: ${ride.driver?.name ?? ""}`}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </Card>

      {selectedRide ? (
        <>
          <Card className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b p-3">
              <div>
                <p className="font-medium">
                  Ride: {selectedRide.originAddress} → {selectedRide.destinationAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  Driver: {selectedRide.driver?.name ?? "You"} ·{" "}
                  {selectedRide.totalSeats - selectedRide.availableSeats} passenger(s)
                </p>
              </div>
            </div>

            <div className="bg-accent/20 px-3 py-1.5 text-center text-xs font-medium text-primary">
              Trip starts {formatTime(selectedRide.departureTime)}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No messages yet — say hello to coordinate pickup details.
                  </p>
                )}
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                      {!isOwn && (
                        <span className="mb-0.5 text-xs text-muted-foreground">{message.sender?.name}</span>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                          isOwn
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-muted text-foreground",
                        )}
                      >
                        {message.content}
                      </div>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatTime(message.sentAt)}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setDraft(reply)}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {reply}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(draft);
              }}
            >
              <Input
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button type="submit" size="icon" disabled={!draft.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </Card>

          <Card className="hidden w-64 shrink-0 flex-col gap-4 p-4 xl:flex">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Trip Summary</h3>
              <div className="flex items-start gap-2 text-sm">
                <div className="flex flex-col items-center pt-1">
                  <div className="size-2 rounded-full bg-primary" />
                  <div className="my-1 h-6 w-px bg-border" />
                  <div className="size-2 rounded-full bg-muted-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-xs">{selectedRide.originAddress}</p>
                  <p className="text-xs">{selectedRide.destinationAddress}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Time</span>
                <span className="font-medium">{formatTime(selectedRide.departureTime)}</span>
              </div>
              {selectedRide.vehicle && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Car Plate</span>
                  <span className="font-medium">{selectedRide.vehicle.plate}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price / Seat</span>
                <span className="font-medium">{formatCurrency(selectedRide.pricePerSeat)}</span>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Select a chat to start coordinating your ride.
        </Card>
      )}
    </div>
  );
}

export default function ChatsPage() {
  return (
    <RequireAuth>
      <Suspense>
        <ChatsContent />
      </Suspense>
    </RequireAuth>
  );
}

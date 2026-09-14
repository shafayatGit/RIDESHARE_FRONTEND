"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDateTime, initials } from "@/lib/format";
import type { Ride } from "@/lib/types";
import { CalendarClock, Heart, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const favoriteDrivers = [
  { name: "Jordan Smith", detail: "Tesla Model 3" },
  { name: "Sarah Chen", detail: "Honda Civic Hybrid" },
];

function ProfileContent() {
  const { user, logout, updateLocalUser } = useAuth();
  const router = useRouter();
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [settings, setSettings] = React.useState({
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    pushNotifications: true,
    shareCampusStatus: false,
  });

  React.useEffect(() => {
    api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load rides"))
      .finally(() => setIsLoading(false));
  }, []);

  if (!user) return null;

  const postedRides = rides.filter((r) => r.driverId === user.id);

  const handleCancelRide = async (rideId: string) => {
    try {
      await api.delete(`/ride/${rideId}`);
      setRides((prev) => prev.filter((r) => r.id !== rideId));
      toast.success("Ride cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel ride");
    }
  };

  const handleEditProfile = (form: FormData) => {
    updateLocalUser({
      name: form.get("name") as string,
      phoneNumber: (form.get("phoneNumber") as string) || null,
    });
    setEditOpen(false);
    toast.success("Profile updated");
  };

  const handleSaveSettings = () => {
    updateLocalUser({ phoneNumber: settings.phoneNumber || null });
    toast.success("Preferences saved");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <Avatar size="lg" className="size-16">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.isVerified ? "Verified community member" : "Community member"}
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-semibold text-primary">
                      {user.avgRatingAsDriver.toFixed(1)}★
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-semibold">{user.cancellationCount}</p>
                    <p className="text-xs text-muted-foreground">Cancellations</p>
                  </div>
                </div>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form action={handleEditProfile} className="flex flex-col gap-4">
                      <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-1.5">
                        <Label>Name</Label>
                        <Input name="name" defaultValue={user.name} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Phone number</Label>
                        <Input name="phoneNumber" defaultValue={user.phoneNumber ?? ""} />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Heart className="size-4" /> Favorite Drivers
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {favoriteDrivers.map((driver) => (
                  <div key={driver.name} className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{initials(driver.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">{driver.detail}</p>
                    </div>
                    <Heart className="size-4 fill-current text-primary" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Tabs defaultValue="posted">
              <TabsList>
                <TabsTrigger value="posted">Posted Rides</TabsTrigger>
                <TabsTrigger value="booked">Booked Rides</TabsTrigger>
              </TabsList>
              <TabsContent value="posted" className="mt-4 flex flex-col gap-3">
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : postedRides.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MapPin />
                      </EmptyMedia>
                      <EmptyTitle>No posted rides yet</EmptyTitle>
                      <EmptyDescription>Offer your first ride to the campus community.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild size="sm">
                        <Link href="/offer">Offer a Ride</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  postedRides.map((ride) => (
                    <Card key={ride.id}>
                      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-medium">
                            <MapPin className="size-3.5 text-primary" />
                            {ride.originAddress} → {ride.destinationAddress}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" />
                            {formatDateTime(ride.departureTime)} · {formatCurrency(ride.pricePerSeat)}
                            /seat
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={ride.status === "SCHEDULED" ? "eco" : "secondary"}>
                            {ride.status}
                          </Badge>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/find/${ride.id}`}>Manage</Link>
                          </Button>
                          {ride.status === "SCHEDULED" && (
                            <Button size="sm" variant="destructive" onClick={() => handleCancelRide(ride.id)}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              <TabsContent value="booked" className="mt-4">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MapPin />
                    </EmptyMedia>
                    <EmptyTitle>No booked rides yet</EmptyTitle>
                    <EmptyDescription>
                      Once you book a seat, it will show up here.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild size="sm">
                      <Link href="/find">Find a Ride</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Settings & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Communication Email</Label>
                    <Input value={settings.email} disabled />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Phone Number</Label>
                    <Input
                      value={settings.phoneNumber ?? ""}
                      onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Real-time alerts for ride changes</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(v) => setSettings({ ...settings, pushNotifications: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Share Campus Status</Label>
                    <p className="text-xs text-muted-foreground">Show if you are currently on campus</p>
                  </div>
                  <Switch
                    checked={settings.shareCampusStatus}
                    onCheckedChange={(v) => setSettings({ ...settings, shareCampusStatus: v })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={handleLogout}>
                    Log Out
                  </Button>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

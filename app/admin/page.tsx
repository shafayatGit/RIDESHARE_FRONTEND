"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import type { Ride } from "@/lib/types";
import { AlertTriangle, Download, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const reportedIssues = [
  { reporter: "Alex Rivera", type: "Missed Departure", severity: "CRITICAL", time: "08:42 AM" },
  { reporter: "Sam J.", type: "Vehicle Cleanliness", severity: "LOW", time: "07:15 AM" },
  { reporter: "Dr. Taylor", type: "App Bug: Payment", severity: "MEDIUM", time: "Yesterday" },
  { reporter: "Jordan Lee", type: "Safety Concern", severity: "CRITICAL", time: "Yesterday" },
];

const safetyAlerts = [
  {
    title: "Route Deviation",
    detail: "Ride #8819 from Main Gate to Science Hub has deviated 1.2km from expected route.",
    time: "2m ago",
    live: true,
  },
  {
    title: "Extreme Speed",
    detail: "Driver 'Mike P.' logged speeds exceeding 60km/h in pedestrian zone B.",
    time: "15m ago",
    live: false,
  },
  {
    title: "Incident Cleared",
    detail: "Minor collision on East Ring Road resolved. No injuries reported.",
    time: "1h ago",
    live: false,
  },
];

const severityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  CRITICAL: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
};

function AdminContent() {
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchRides = React.useCallback(() => {
    return api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load rides"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchRides();
  };

  const activeRides = rides.filter((r) => r.status === "SCHEDULED" || r.status === "ONGOING").length;
  const waitlisted = rides.filter((r) => r.availableSeats === 0).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">System Overview</p>
            <h1 className="text-2xl font-semibold">Campus Operations</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Report export isn't wired to the backend yet")}
            >
              <Download /> Export Report
            </Button>
            <Button size="sm" onClick={handleRefresh}>
              <RefreshCw /> Live Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CO2 Savings Tracker</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Reducing campus carbon footprint, one ride at a time.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <span className="text-3xl font-semibold text-primary">1,284.5</span>
                  <span className="ml-1 text-sm text-muted-foreground">kg saved this semester</span>
                </div>
                <Progress value={72} />
                <p className="text-xs text-muted-foreground">72% of annual goal reached</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Active Rides</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold">{activeRides}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{waitlisted} waitlisted</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Total Community</p>
                  <p className="text-2xl font-semibold">3.8k</p>
                  <p className="text-xs text-muted-foreground">142 pending verification</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Reported Issues</CardTitle>
                <Button variant="link" size="sm">
                  View All Reports
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportedIssues.map((issue, i) => (
                      <TableRow key={i}>
                        <TableCell>{issue.reporter}</TableCell>
                        <TableCell>{issue.type}</TableCell>
                        <TableCell>
                          <Badge variant={severityVariant[issue.severity]}>{issue.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{issue.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <ShieldAlert className="size-4 text-destructive" /> Safety Alerts
                </CardTitle>
                <Badge variant="destructive">LIVE</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {safetyAlerts.map((alert, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <AlertTriangle
                      className={`mt-0.5 size-4 shrink-0 ${alert.live ? "text-destructive" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.detail}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info("Protocol checklist isn't wired to the backend yet")}
                >
                  Protocol Checklist
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Heatmap</CardTitle>
                <p className="text-xs text-muted-foreground">Peak activity: Central Library Hub</p>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
                  <MapPin className="mr-1.5 size-4" /> Heatmap coming soon
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminContent />
    </RequireAuth>
  );
}

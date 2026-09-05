"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authStore } from "@/hooks/auth-store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardComponent() {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isVerified()) {
      router.replace("/otp-verification");
    }
  }, [router]);

  if (!authStore.isVerified()) {
    return null;
  }

  const handleLogout = () => {
    authStore.clear();
    router.replace("/login");
  };

  return (
    <section className="min-h-[calc(100vh-100px)] bg-white p-3 text-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Your account is verified. You can now access the dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}

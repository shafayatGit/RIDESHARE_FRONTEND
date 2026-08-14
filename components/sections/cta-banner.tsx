import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-foreground p-10 text-background sm:flex-row">
        <div>
          <h2 className="text-2xl font-semibold">Ready to start sharing?</h2>
          <p className="mt-2 max-w-md text-sm text-background/70">
            Join thousands of students reducing emissions and saving money.
            Whether you have a car to share or need a ride, join our community.
          </p>
          <div className="mt-6 flex gap-3">
            <Button size="lg">Sign Up Now</Button>
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"
            >
              List a Ride
            </Button>
          </div>
        </div>
        <Car className="h-24 w-24 shrink-0 text-background/20" />
      </div>
    </section>
  );
}

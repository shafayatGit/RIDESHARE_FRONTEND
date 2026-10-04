import { Card } from "@/components/ui/card";
import { Clock, HandCoins, Leaf, ShieldCheck, UserPlus } from "lucide-react";
import Image from "next/image";

export function CommunityBenefits() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-8 text-lg font-semibold">Community Benefits</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative col-span-full flex flex-col justify-between bg-primary p-6 text-primary-foreground sm:col-span-1 lg:col-span-2 row-span-2">
            <div>
              <HandCoins className="mt-6 h-8 w-8 opacity-80 p-1" />
              <h3 className="text-lg font-semibold">Drastic Fuel Savings</h3>
              <p className="mt-2 max-w-sm text-sm text-primary-foreground/80">
                Students save an average of $200 per semester by sharing rides
                instead of paying full commuting expenses to and from campus.
              </p>
            </div>

            <Image
              src="/dollar.svg"
              alt=""
              width={32}
              height={32}
              className="absolute bottom-4 right-4 h-16 w-16 opacity-15"
            />
          </Card>

          <Card className="flex flex-row justify-between p-6 sm:col-span-1 lg:col-span-2 items-center">
            <ShieldCheck className="h-12 w-12 p-1.5 text-primary bg-green-200 rounded-sm" />

            <div className="flex flex-col gap-2 text-sm font-medium">
              <p>Verified Community</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Strict .edu verification and driver ratings keep every ride safe
                and accountable.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col bg-chart-2 p-8 items-center ">
            <Leaf className="mb-2 h-5 w-5 text-white font-bold" />
            <div className="text-2xl font-light text-white font-[Impact,sans-serif]">
              ECO IMPACT
            </div>
            <div className="text-2xl font-bold text-white">240t</div>
            <p className="text-sm text-white opacity-80">CO2 Reduced Yearly</p>
          </Card>

          <Card className="flex flex-col items-center bg-chart-1 p-8">
            <UserPlus className="mb-2 h-8 w-8 text-primary" />
            <div className="text-xl ">FRIENDS</div>
            <h1 className="text-2xl font-bold">15k+</h1>
            <p className="text-sm text-muted-foreground">Student Connections</p>
          </Card>
        </div>
      </div>
    </section>
  );
}

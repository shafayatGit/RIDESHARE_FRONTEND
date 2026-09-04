import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { CommunityBenefits } from "@/components/modules/Home/sections/community-benefits";
import { CtaBanner } from "@/components/modules/Home/sections/cta-banner";
import { Features } from "@/components/modules/Home/sections/features";
import { Hero } from "@/components/modules/Home/sections/hero";
import { TrendingDestinations } from "@/components/modules/Home/sections/trending-destinations";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Hero />
        <Features />
        <CommunityBenefits />
        <TrendingDestinations />
        <CtaBanner />
      </main>
    </div>
  );
}

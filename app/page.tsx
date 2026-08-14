import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { CommunityBenefits } from "@/components/sections/community-benefits";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Features } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";
import { TrendingDestinations } from "@/components/sections/trending-destinations";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <CommunityBenefits />
        <TrendingDestinations />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

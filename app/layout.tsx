import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RideShare — Share the Ride, Save the Planet",
  description:
    "Connect with fellow students, reduce your campus carbon footprint, and split fuel costs with reliable carpooling built for your academic community.",
  // icons: { icon: "app/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        dmSans.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {" "}
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

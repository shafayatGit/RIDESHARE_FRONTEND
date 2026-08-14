import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

const destinations = [
  {
    name: "North Campus District",
    location: "Metro City Station",
    price: "$3/trip",
    discount: "15% OFF",
    image: "/destinations/north-campus.jpg",
  },
  {
    name: "West Side Apartments",
    location: "Central University District",
    price: "$4/trip",
    discount: "20% OFF",
    image: "/destinations/west-side.jpg",
  },
  {
    name: "Main Library Loop",
    location: "International Airport Rd",
    price: "$2/trip",
    discount: "10% OFF",
    image: "/destinations/library-loop.jpg",
  },
];

export function TrendingDestinations() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Trending Destinations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The most frequent routes currently active on campus.
          </p>
        </div>
        <Link href="/routes" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View All Routes <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {destinations.map((dest) => (
          <Card key={dest.name} className="overflow-hidden py-0">
            <div className="relative h-40 w-full">
              <Image src={dest.image} alt={dest.name} fill className="object-cover" />
              <Badge className="absolute left-3 top-3 bg-background text-foreground">
                {dest.discount}
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{dest.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {dest.location}
              </p>
              <p className="mt-3 font-medium text-primary">{dest.price}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
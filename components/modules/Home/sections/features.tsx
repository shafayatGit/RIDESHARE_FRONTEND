import { Car, MessageCircle, Search } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Search or Post",
    description:
      "Find an existing ride matching your schedule, or offer your own seats to others.",
  },
  {
    icon: MessageCircle,
    title: "Connect & Confirm",
    description:
      "Chat with your driver or passenger to sort out route details and pickup points.",
  },
  {
    icon: Car,
    title: "Ride & Save",
    description:
      "Meet up, drive together, and split fuel costs — automatically, for every shared ride.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Seamless Commuting
      </h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

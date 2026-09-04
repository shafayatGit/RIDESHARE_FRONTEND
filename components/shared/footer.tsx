export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <span className="font-medium text-foreground">RideShare</span>
        <p>© 2026 RideShare. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">
            Campus Resources
          </a>
          <a href="#" className="hover:text-foreground">
            Support
          </a>
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}

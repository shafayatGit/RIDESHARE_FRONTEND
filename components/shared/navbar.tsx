"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/format";
import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Find a Ride", href: "/find" },
  { label: "Offer a Ride", href: "/offer" },
  { label: "Profile", href: "/profile" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary text-xl md:text-2xl font-bold"
        >
          <Image
            src="/logo.svg"
            alt="RideShare Logo"
            width={24}
            height={24}
            className="w-5 h-5 md:w-8 md:h-8"
          />
          RideShare
          {user?.isAdmin && (
            <Badge variant="eco" className="ml-1 hidden sm:inline-flex">
              Admin Panel
            </Badge>
          )}
        </Link>

        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Go to dashboard"
              >
                <Link href="/dashboard">
                  <Avatar>
                    <AvatarImage src={user.image ?? ""} alt={user.name} />
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-1.5 size-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Button variant="ghost" className="justify-start">
                  Log in
                </Button>
              </Link>
              <Link
                href="/registration"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Button className="justify-start">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-primary">RideShare</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={user.image ?? ""} alt={user.name} />
                      <AvatarFallback>{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    Driver Dashboard
                  </Link>
                  <Link
                    href="/chats"
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ride Chats
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Campus Operations
                    </Link>
                  )}
                </>
              )}
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-1.5 size-4" />
                    Log out
                  </Button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Button variant="ghost" className="justify-start">
                        Log in
                      </Button>
                    </Link>
                    <Link
                      href="/registration"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Button className="justify-start">Sign up</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

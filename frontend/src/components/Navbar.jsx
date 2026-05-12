"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Wallet, LayoutDashboard, Settings, History, Target, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Management", path: "/management", icon: Settings },
  { name: "Transaksi", path: "/transactions", icon: History },
  { name: "Savings", path: "/savings", icon: Target },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Jangan tampilkan navbar di halaman login & register
  if (pathname === "/login" || pathname === "/register") return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Wallet className="text-primary w-6 h-6" />
          <span className="hidden sm:inline">HaloKalin</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/20 transition-all"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/20">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col h-full bg-card/95 border-primary/20 w-[280px]">
            <SheetHeader className="border-b border-primary/10 pb-4 mb-4">
              <SheetTitle className="text-left flex items-center gap-2">
                <Wallet className="text-primary" />
                HaloKalin
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group
                      ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-primary/20 hover:text-primary hover:pl-6"
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "" : "text-muted-foreground group-hover:text-primary"}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-primary/10">
              <Button
                variant="destructive"
                className="w-full justify-start gap-3 px-4 py-6"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold">Logout</span>
              </Button>
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

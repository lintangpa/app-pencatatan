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
  { name: "Setting", path: "/setting", icon: Settings },
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

  // Jangan tampilkan navbar di halaman login, register, & forgot-password
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/login/" || pathname === "/register/" || pathname === "/forgot-password/") return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <img src="/hk.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
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
                <img src="/hk.png" alt="Logo" className="w-6 h-6 rounded-md object-cover" />
                HaloKalin
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-2 pl-4">
              {menuItems.map((item) => {
                const isActive = item.path === "/" 
                  ? pathname === "/" || pathname === "" 
                  : pathname.startsWith(item.path);
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 group
                      ${isActive
                        ? "bg-primary text-primary-foreground rounded-l-xl rounded-r-none shadow-[-4px_0_10px_rgba(var(--primary),0.2)]"
                        : "hover:bg-primary/20 hover:text-primary hover:pl-6 rounded-l-xl rounded-r-none"
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "" : "text-muted-foreground group-hover:text-primary"}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-primary/10 px-4 mb-6">
              <Button
                variant="destructive"
                className="w-full justify-center gap-3 px-4 py-6 rounded-xl font-bold shadow-lg shadow-destructive/10 transition-transform active:scale-95"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </Button>
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Wallet, TrendingUp, Target, Bell } from 'lucide-react';

export default function Home() {
  const [token, setToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
    } else {
      setToken(storedToken);
    }
  }, [router]);

  if (!token) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* Hero / Summary Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Saldo", value: "Rp 0", icon: Wallet },
          { title: "Pemasukan Mei", value: "Rp 0", icon: TrendingUp },
          { title: "Pengeluaran Mei", value: "Rp 0", icon: TrendingUp, rotate: true },
          { title: "Savings Goal", value: "0%", icon: Target },
        ].map((item, i) => (
          <Card key={i} className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className={`w-4 h-4 text-primary ${item.rotate ? 'rotate-180' : ''}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Placeholder */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifikasi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Belum ada notifikasi atau transaksi terbaru.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

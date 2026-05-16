"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleRegister = async () => {
    setIsConfirmOpen(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Registrasi berhasil!", {
          description: "Silakan masuk dengan akun baru Anda.",
        });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        toast.error(data.message || "Registrasi gagal");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 overflow-hidden fixed inset-0">
      <Card className="w-full max-w-sm border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <img src="/hk.png" alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Daftar Akun</CardTitle>
          <CardDescription className="text-center">
            Buat akun baru untuk mulai mencatat keuangan
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleOpenConfirm}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pendaftaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mendaftar? Harap dicatat bahwa username Anda bersifat rahasia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleRegister}>
              Ya, Daftar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

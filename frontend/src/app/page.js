'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  Target, 
  Plus, 
  Trash2, 
  PiggyBank, 
  FileText, 
  Loader2, 
  ChevronRight,
  CircleDollarSign
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = "http://localhost:3001/api";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    max_budget: 0
  });
  const [savings, setSavings] = useState([]);
  const [notes, setNotes] = useState([]);
  
  // Note Modal States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const getHeaders = () => ({
    "Authorization": localStorage.getItem("token"),
    "Content-Type": "application/json",
  });

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    setLoading(true);
    try {
      // 1. Fetch Months to find current month budget ID
      const resMonths = await fetch(`${API_URL}/months`, { headers: getHeaders() });
      const months = await resMonths.json();
      
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const activeMonth = months.find(m => m.month === currentMonth && m.year === currentYear);
      
      if (activeMonth) {
        // 2. Fetch Dashboard Summary
        const resSum = await fetch(`${API_URL}/dashboard/${activeMonth.id}`, { headers: getHeaders() });
        const sumData = await resSum.json();
        setSummary(sumData);
      }

      // 3. Fetch Savings
      const resSavings = await fetch(`${API_URL}/savings`, { headers: getHeaders() });
      const savData = await resSavings.json();
      setSavings(savData);

      // 4. Fetch Notes
      const resNotes = await fetch(`${API_URL}/notes`, { headers: getHeaders() });
      const noteData = await resNotes.json();
      setNotes(noteData);

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNote.title) return toast.error("Judul catatan wajib diisi");

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newNote)
      });
      if (res.ok) {
        toast.success("Catatan berhasil ditambahkan");
        const resNotes = await fetch(`${API_URL}/notes`, { headers: getHeaders() });
        setNotes(await resNotes.json());
        setIsNoteModalOpen(false);
        setNewNote({ title: "", content: "" });
      }
    } catch (err) {
      toast.error("Gagal menyimpan catatan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Catatan dihapus");
        setNotes(notes.filter(n => n.id !== id));
      }
    } catch (err) {
      toast.error("Gagal menghapus catatan");
    }
  };

  if (loading && !summary.max_budget && savings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long' });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24 text-foreground">
      
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Sisa Budget", 
            value: formatIDR(summary.max_budget - summary.total_expense), 
            icon: Wallet,
            color: "text-primary"
          },
          { 
            title: `Pemasukan ${currentMonthName}`, 
            value: formatIDR(summary.total_income), 
            icon: TrendingUp,
            color: "text-green-500"
          },
          { 
            title: `Pengeluaran ${currentMonthName}`, 
            value: formatIDR(summary.total_expense), 
            icon: TrendingUp, 
            rotate: true,
            color: "text-red-500"
          },
          { 
            title: "Total Budget", 
            value: formatIDR(summary.max_budget), 
            icon: CircleDollarSign,
            color: "text-blue-500"
          },
        ].map((item, i) => (
          <Card key={i} className="border-primary/10 bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden group hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.title}</CardTitle>
              <item.icon className={`w-4 h-4 ${item.color} ${item.rotate ? 'rotate-180' : ''}`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SAVINGS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <PiggyBank className="text-primary w-5 h-5" />
            Tabungan Impian
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10" onClick={() => router.push('/savings')}>
            Lihat Semua <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
          {savings.length > 0 ? (
            savings.map((s) => (
              <Card key={s.id} className="min-w-[240px] border-primary/10 bg-card/40 rounded-2xl snap-start p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm truncate pr-2">{s.name}</p>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {Math.min(Math.round(s.progress_percentage), 100)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${Math.min(s.progress_percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-medium">
                  <span className="text-foreground font-bold"> {formatIDR(s.current_amount)} </span>
                  <span className="text-muted-foreground">dari {formatIDR(s.target_amount)}</span>
                </div>
              </Card>
            ))
          ) : (
            <div className="w-full py-8 text-center text-xs text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-primary/10">
              Belum ada target tabungan.
            </div>
          )}
        </div>
      </section>

      {/* NOTES SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="text-primary w-5 h-5" />
            Catatan Penting
          </h2>

          <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full h-8 px-4 text-xs font-bold shadow-lg shadow-primary/20">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/20 text-card-foreground">
              <DialogHeader>
                <DialogTitle>Tambah Catatan Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateNote} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Judul Catatan</Label>
                  <Input 
                    placeholder="misal: Rencana Belanja, Catatan Hutang"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    required
                    className="bg-muted/50 border-primary/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Isi Catatan</Label>
                  <textarea 
                    placeholder="Tulis detail catatanmu di sini..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    rows={4}
                    className="w-full rounded-lg border border-input bg-muted/50 border-primary/10 px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-11 font-bold" disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Catatan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {notes.length > 0 ? (
            notes.map((n) => (
              <Card key={n.id} className="border-primary/10 bg-card/40 rounded-2xl group transition-all hover:border-primary/30">
                <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground">{n.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {n.content || "Tidak ada detail."}
                    </CardDescription>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteNote(n.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground bg-muted/5 rounded-3xl border-2 border-dashed border-primary/10">
              Belum ada catatan. Klik "Tambah" untuk mencatat sesuatu.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

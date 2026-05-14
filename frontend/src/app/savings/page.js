"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  PiggyBank, 
  Target, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Calendar,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog-custom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function SavingsPage() {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for New/Edit Goal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target_amount: "",
    displayTarget: "",
    deadline: ""
  });

  // States for Modifying Balance
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [balanceAction, setBalanceAction] = useState("add"); // 'add' or 'subtract'
  const [amountInput, setAmountInput] = useState("");
  const [displayAmountInput, setDisplayAmountInput] = useState("");

  // Delete Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  // History states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyNote, setHistoryNote] = useState("");

  const getHeaders = () => ({
    "Authorization": localStorage.getItem("token"),
    "Content-Type": "application/json",
  });

  const fetchSavings = async () => {
    try {
      const res = await fetch(`${API_URL}/savings`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSavings(data);
      }
    } catch (err) {
      toast.error("Gagal memuat data tabungan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const toRupiah = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleAmountChange = (e, setRaw, setDisplay) => {
    const val = e.target.value;
    const rawValue = val.replace(/\D/g, "");
    setRaw(rawValue);
    setDisplay(toRupiah(rawValue));
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount) return toast.error("Data belum lengkap");

    setActionLoading(true);
    const method = editingGoal ? "PUT" : "POST";
    const url = editingGoal ? `${API_URL}/savings/${editingGoal.id}` : `${API_URL}/savings`;

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          name: newGoal.name,
          target_amount: parseFloat(newGoal.target_amount),
          deadline: newGoal.deadline || null
        })
      });
      if (res.ok) {
        toast.success(editingGoal ? "Target tabungan diperbarui" : "Target tabungan berhasil dibuat");
        fetchSavings();
        setIsAddModalOpen(false);
        resetForm();
      } else {
        toast.error(editingGoal ? "Gagal memperbarui target" : "Gagal membuat target tabungan");
      }
    } catch (err) {
      toast.error("Kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setEditingGoal(null);
    setNewGoal({ name: "", target_amount: "", displayTarget: "", deadline: "" });
  };

  const openEdit = (s) => {
    setEditingGoal(s);
    setNewGoal({
      name: s.name,
      target_amount: Math.round(s.target_amount).toString(),
      displayTarget: toRupiah(Math.round(s.target_amount).toString()),
      deadline: s.deadline && s.deadline !== "0000-00-00" 
        ? (() => {
            const d = new Date(s.deadline);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })()
        : ""
    });
    setIsAddModalOpen(true);
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!amountInput) return toast.error("Masukkan nominal");

    const finalAmount = balanceAction === "add" ? parseFloat(amountInput) : -parseFloat(amountInput);

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/savings/${selectedGoal.id}/add`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ 
          amount_added: finalAmount,
          note: historyNote
        })
      });
      if (res.ok) {
        toast.success(balanceAction === "add" ? "Tabungan ditambahkan" : "Saldo tabungan ditarik");
        fetchSavings();
        setIsBalanceModalOpen(false);
        setAmountInput("");
        setDisplayAmountInput("");
        setHistoryNote("");
      } else {
        toast.error("Gagal memperbarui saldo");
      }
    } catch (err) {
      toast.error("Kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteGoal = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/savings/${id}/complete`, {
        method: "PUT",
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Selamat! Target tabungan tercapai!");
        fetchSavings();
      }
    } catch (err) {
      toast.error("Kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/savings/${goalToDelete.id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Target tabungan dihapus");
        fetchSavings();
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      toast.error("Kesalahan koneksi");
    } finally {
      setActionLoading(false);
      setGoalToDelete(null);
    }
  };

  const fetchHistory = async (goal) => {
    setSelectedGoal(goal);
    setHistoryLoading(true);
    setIsHistoryModalOpen(true);
    try {
      const res = await fetch(`${API_URL}/savings/${goal.id}/history`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (err) {
      toast.error("Gagal memuat riwayat");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openBalanceModal = (goal, action) => {
    setSelectedGoal(goal);
    setBalanceAction(action);
    setIsBalanceModalOpen(true);
  };

  const confirmDelete = (goal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 text-foreground space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="text-primary w-6 h-6" />
            Tabungan
          </h1>
          <p className="text-sm text-muted-foreground">Wujudkan impianmu dengan menabung teratur.</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={(val) => { setIsAddModalOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Target Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 text-card-foreground">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Target Tabungan" : "Buat Target Tabungan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveGoal} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Apa yang ingin kamu capai?</Label>
                <Input 
                  placeholder="misal: Beli Laptop Baru, Liburan ke Bali"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  required
                  className="bg-muted/50 border-primary/10 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Target Nominal</Label>
                <Input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp0"
                  value={newGoal.displayTarget}
                  onChange={(e) => handleAmountChange(e, (val) => setNewGoal(prev => ({...prev, target_amount: val})), (val) => setNewGoal(prev => ({...prev, displayTarget: val})))}
                  required
                  className="bg-muted/50 border-primary/10 h-11 text-lg font-bold text-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tenggat Waktu (Opsional)</Label>
                <Input 
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="bg-muted/50 border-primary/10 h-11"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-11 font-bold" disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingGoal ? "Simpan Perubahan" : "Mulai Menabung"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SAVINGS LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Memuat impianmu...</p>
          </div>
        ) : savings.length > 0 ? (
          savings.map((s) => (
            <Card key={s.id} className={`bg-card/40 border-primary/10 overflow-hidden relative group transition-all hover:border-primary/30 rounded-2xl ${s.is_completed ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {s.name}
                      {Boolean(s.is_completed) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {s.deadline && s.deadline !== "0000-00-00" ? new Date(s.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa batas waktu'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary/70 hover:text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); fetchHistory(s); }}>
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary/70 hover:text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/50 hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); confirmDelete(s); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">Progress Tabungan</span>
                    <span className="text-primary">{Math.min(Math.round(s.progress_percentage), 100)}%</span>
                  </div>
                  <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${s.is_completed ? 'bg-green-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(s.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">{formatIDR(s.current_amount)}</span>
                    <span className="text-muted-foreground">dari {formatIDR(s.target_amount)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {!s.is_completed ? (
                    <>
                      <Button className="flex-1 h-9 rounded-xl text-xs font-bold" onClick={() => openBalanceModal(s, "add")}>
                        <ArrowDownLeft className="w-3.5 h-3.5 mr-1" /> Nabung
                      </Button>
                      <Button variant="outline" className="flex-1 h-9 rounded-xl border-primary/20 text-xs font-bold" onClick={() => openBalanceModal(s, "subtract")}>
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Tarik
                      </Button>
                      {s.progress_percentage >= 100 && (
                        <Button variant="secondary" className="h-9 w-9 p-0 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20" onClick={() => handleCompleteGoal(s.id)}>
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center py-2 bg-green-500/10 rounded-xl text-green-500 text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> TARGET TERCAPAI
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}

        {!loading && savings.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-primary/10 rounded-3xl bg-card/10 flex flex-col items-center gap-3">
             <PiggyBank className="w-12 h-12 opacity-10" />
             <div className="space-y-1">
               <p className="font-bold text-muted-foreground/60">Belum Ada Target Tabungan</p>
               <p className="text-xs">Klik tombol di atas untuk mulai mencatat impianmu.</p>
             </div>
          </div>
        )}
      </div>

      {/* BALANCE MODIFICATION MODAL */}
      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="bg-card border-primary/20 text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {balanceAction === 'add' ? <ArrowDownLeft className="text-green-500" /> : <ArrowUpRight className="text-red-500" />}
              {balanceAction === 'add' ? 'Tambah Saldo Tabungan' : 'Tarik Saldo Tabungan'}
            </DialogTitle>
            <DialogDescription>
              {selectedGoal?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBalance} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nominal yang ingin {balanceAction === 'add' ? 'ditabung' : 'ditarik'}</Label>
              <Input 
                type="text"
                inputMode="numeric"
                placeholder="Rp0"
                value={displayAmountInput}
                onChange={(e) => handleAmountChange(e, setAmountInput, setDisplayAmountInput)}
                required
                className="bg-muted/50 border-primary/10 h-11 text-lg font-bold text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Catatan (Opsional)</Label>
              <Input 
                placeholder="misal: Bonus akhir bulan"
                value={historyNote}
                onChange={(e) => setHistoryNote(e.target.value)}
                className="bg-muted/50 border-primary/10 h-11"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className={`w-full h-11 font-bold ${balanceAction === 'add' ? 'bg-primary' : 'bg-destructive hover:bg-destructive/90'}`} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi {balanceAction === 'add' ? 'Nabung' : 'Tarik Saldo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* HISTORY SHEET (Previously Modal) */}
      <Sheet open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <SheetContent className="bg-card border-primary/20 text-card-foreground w-full sm:max-w-md flex flex-col p-0">
          <div className="p-6 pb-0">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-primary text-xl">
                <TrendingUp className="w-5 h-5" />
                Riwayat Tabungan
              </SheetTitle>
              <SheetDescription className="text-muted-foreground font-medium">
                {selectedGoal?.name}
              </SheetDescription>
            </SheetHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 space-y-4 py-6 scrollbar-hide">
            {historyLoading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Memuat perjalanan menabungmu...</p>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((h, idx) => (
                  <div 
                    key={h.id} 
                    className="bg-muted/30 border border-primary/5 rounded-2xl p-4 flex justify-between items-center group hover:bg-muted/50 transition-all hover:scale-[1.02] duration-200"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${h.type === 'nabung' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {h.type === 'nabung' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-none">{h.type === 'nabung' ? 'Nabung' : 'Tarik Saldo'}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                            {new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(h.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {h.note && (
                        <div className="pl-10">
                          <p className="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1 rounded-md border border-primary/5">
                            "{h.note}"
                          </p>
                        </div>
                      )}
                    </div>
                    <p className={`font-bold text-lg ${h.type === 'nabung' ? 'text-green-500' : 'text-red-500'}`}>
                      {h.type === 'nabung' ? '+' : ''}{formatIDR(h.amount_added)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                  <PiggyBank className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-muted-foreground">Belum ada transaksi</p>
                  <p className="text-xs text-muted-foreground/60 px-10">Mulailah menabung untuk melihat riwayat transaksimu di sini.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 pt-2 border-t border-primary/10">
            <Button variant="outline" className="w-full h-12 rounded-xl border-primary/20 font-bold hover:bg-primary/5 transition-colors" onClick={() => setIsHistoryModalOpen(false)}>
              Tutup Riwayat
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* DELETE CONFIRMATION */}
      <AlertDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Target Tabungan?"
        description={`Apakah Anda yakin ingin menghapus target "${goalToDelete?.name}"? Aksi ini akan menghapus semua riwayat tabungan untuk target ini.`}
        onConfirm={handleDeleteGoal}
        loading={actionLoading}
      />
    </div>
  );
}

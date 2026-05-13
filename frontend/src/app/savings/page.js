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
  ChevronRight
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
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog-custom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function SavingsPage() {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for New Goal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount) return toast.error("Data belum lengkap");

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/savings`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: newGoal.name,
          target_amount: parseFloat(newGoal.target_amount),
          deadline: newGoal.deadline || null
        })
      });
      if (res.ok) {
        toast.success("Target tabungan berhasil dibuat");
        fetchSavings();
        setIsAddModalOpen(false);
        setNewGoal({ name: "", target_amount: "", displayTarget: "", deadline: "" });
      } else {
        toast.error("Gagal membuat target tabungan");
      }
    } catch (err) {
      toast.error("Kesalahan koneksi");
    } finally {
      setActionLoading(true);
      setActionLoading(false);
    }
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
        body: JSON.stringify({ amount_added: finalAmount })
      });
      if (res.ok) {
        toast.success(balanceAction === "add" ? "Tabungan ditambahkan" : "Saldo tabungan ditarik");
        fetchSavings();
        setIsBalanceModalOpen(false);
        setAmountInput("");
        setDisplayAmountInput("");
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

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Target Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 text-card-foreground">
            <DialogHeader>
              <DialogTitle>Buat Target Tabungan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGoal} className="space-y-4 py-4">
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
                  Mulai Menabung
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/50 hover:text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(s)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
                placeholder="Rp0"
                value={displayAmountInput}
                onChange={(e) => handleAmountChange(e, setAmountInput, setDisplayAmountInput)}
                required
                className="bg-muted/50 border-primary/10 h-11 text-lg font-bold text-primary"
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

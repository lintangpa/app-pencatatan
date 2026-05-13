"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Trash2, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2,
  Calendar,
  ChevronDown,
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog-custom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter & Sort states
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterCategory, setFilterCategory] = useState("all");

  // Summary & Dashboard states
  const [summary, setSummary] = useState({
    max_budget: 0,
    total_expense: 0,
    sisa_budget: 0,
    detail_kategori: []
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    category_budget_id: "",
    type: "expense",
    amount: "",
    displayAmount: "",
    note: "",
    is_reimbursed: false
  });

  const getHeaders = () => ({
    "Authorization": localStorage.getItem("token"),
    "Content-Type": "application/json",
  });

  const fetchMonths = async () => {
    try {
      const res = await fetch(`${API_URL}/months`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setMonths(data);
      }
    } catch (err) {
      console.error("Error fetching months:", err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const monthObj = months.find(m => m.year === parseInt(year) && m.month === parseInt(month));
      
      if (!monthObj) {
        setTransactions([]);
        setSummary({ max_budget: 0, total_expense: 0, sisa_budget: 0, detail_kategori: [] });
        setLoading(false);
        return;
      }

      // Fetch Transactions
      const res = await fetch(`${API_URL}/transactions?month_budget_id=${monthObj.id}`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setTransactions(data);

      // Fetch Summary/Dashboard
      const dashRes = await fetch(`${API_URL}/dashboard/${monthObj.id}`, { headers: getHeaders() });
      const dashData = await dashRes.json();
      if (dashRes.ok) setSummary(dashData);

    } catch (err) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const [year, month] = selectedMonth.split("-");
    const monthObj = months.find(m => m.year === parseInt(year) && m.month === parseInt(month));
    
    if (monthObj) {
      try {
        const res = await fetch(`${API_URL}/months/${monthObj.id}/categories`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) setCategories(data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (months.length > 0) {
      fetchTransactions();
      fetchCategories();
      setCurrentPage(1); // Reset page on month change
    }
  }, [selectedMonth, months]);

  const toRupiah = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const rawValue = val.replace(/\D/g, "");
    setFormData({ ...formData, amount: rawValue, displayAmount: toRupiah(rawValue) });
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const [year, month] = selectedMonth.split("-");
    const monthObj = months.find(m => m.year === parseInt(year) && m.month === parseInt(month));

    if (!monthObj) return toast.error("Bulan budget belum dibuat untuk periode ini");
    if (!formData.category_budget_id) return toast.error("Pilih kategori");

    const body = {
      month_budget_id: monthObj.id,
      category_budget_id: formData.category_budget_id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      note: formData.note,
      is_reimbursed: formData.is_reimbursed
    };

    const url = editingTransaction ? `${API_URL}/transactions/${editingTransaction.id}` : `${API_URL}/transactions`;
    const method = editingTransaction ? "PUT" : "POST";

    setActionLoading(true);
    try {
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editingTransaction ? "Transaksi diperbarui" : "Transaksi berhasil dicatat");
        fetchTransactions();
        setIsFormOpen(false);
        resetForm();
      } else {
        toast.error("Gagal menyimpan transaksi");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      transaction_date: new Date().toISOString().slice(0, 10),
      category_budget_id: "",
      type: "expense",
      amount: "",
      displayAmount: "",
      note: "",
      is_reimbursed: false
    });
  };

  const openEdit = (t) => {
    setEditingTransaction(t);
    setFormData({
      transaction_date: t.transaction_date.slice(0, 10),
      category_budget_id: t.category_budget_id?.toString() || "",
      type: t.type,
      amount: t.amount.toString(),
      displayAmount: toRupiah(t.amount.toString()),
      note: t.note || "",
      is_reimbursed: !!t.is_reimbursed
    });
    setIsFormOpen(true);
  };

  const confirmDelete = (t) => {
    setItemToDelete(t);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions/${itemToDelete.id}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        toast.success("Transaksi dihapus");
        fetchTransactions();
        setIsDeleteDialogOpen(false);
      } else {
        toast.error("Gagal menghapus");
      }
    } catch (err) {
      toast.error("Kesalahan koneksi");
    } finally {
      setActionLoading(false);
      setItemToDelete(null);
    }
  };

  // Processing Logic
  const allFilteredTransactions = transactions
    .filter(t => {
      const matchSearch = t.note?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          getCategoryName(t.category_budget_id).toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === "all" || t.category_budget_id?.toString() === filterCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.transaction_date) - new Date(a.transaction_date);
      if (sortBy === "date-asc") return new Date(a.transaction_date) - new Date(b.transaction_date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

  const totalPages = Math.ceil(allFilteredTransactions.length / itemsPerPage);
  const processedTransactions = allFilteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || "Tanpa Kategori";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 text-foreground space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="text-primary w-6 h-6" />
            Transaksi
          </h1>
          <p className="text-sm text-muted-foreground">Monitoring arus kas dan budget.</p>
        </div>

        <div className="flex items-center gap-2">
           <div className="relative">
             <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
             <Input 
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="pl-9 bg-card border-primary/20 h-10 w-40 text-sm font-medium"
             />
           </div>

           <Dialog open={isFormOpen} onOpenChange={(val) => { setIsFormOpen(val); if(!val) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full px-5 h-9 font-semibold shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-1" /> Catat
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20 text-card-foreground">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? "Edit Transaksi" : "Tambah Transaksi"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveTransaction} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Tanggal</Label>
                      <Input 
                        type="date" 
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                        required
                        className="bg-muted/50 border-primary/10 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Tipe</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(val) => setFormData({...formData, type: val})}
                      >
                        <SelectTrigger className="bg-muted/50 border-primary/10 h-11">
                          <SelectValue placeholder="Tipe" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="expense">Pengeluaran</SelectItem>
                          <SelectItem value="income">Pemasukan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Jumlah</Label>
                    <Input 
                      type="text" 
                      value={formData.displayAmount}
                      onChange={handleAmountChange}
                      required
                      placeholder="Rp0"
                      className="bg-muted/50 border-primary/10 h-11 text-lg font-bold text-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Kategori</Label>
                    <Select 
                      value={formData.category_budget_id} 
                      onValueChange={(val) => setFormData({...formData, category_budget_id: val})}
                    >
                      <SelectTrigger className="bg-muted/50 border-primary/10 h-11">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                        {categories.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground italic">Belum ada kategori di bulan ini</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Catatan / Deskripsi</Label>
                    <Input 
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                      placeholder="misal: Beli makan siang"
                      className="bg-muted/50 border-primary/10 h-11"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <input 
                      type="checkbox"
                      id="is_reimbursed"
                      checked={formData.is_reimbursed}
                      onChange={(e) => setFormData({...formData, is_reimbursed: e.target.checked})}
                      className="w-5 h-5 rounded border-primary/20 text-primary focus:ring-primary/50 bg-transparent"
                    />
                    <Label htmlFor="is_reimbursed" className="cursor-pointer font-medium">Bisa Di-reimburse</Label>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full h-11 font-bold" disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Transaksi
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="bg-card/40 border-primary/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-12 h-12 text-primary" />
            </div>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Budget</p>
              <h3 className="text-xl font-black mt-1">{formatIDR(summary.max_budget)}</h3>
            </CardContent>
         </Card>
         <Card className="bg-card/40 border-primary/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown className="w-12 h-12 text-red-500" />
            </div>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pengeluaran</p>
              <h3 className="text-xl font-black mt-1 text-red-400">{formatIDR(summary.total_expense)}</h3>
            </CardContent>
         </Card>
         <Card className="bg-card/40 border-primary/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sisa Budget</p>
              <h3 className={`text-xl font-black mt-1 ${summary.sisa_budget < 0 ? 'text-red-500' : 'text-green-400'}`}>
                {formatIDR(summary.sisa_budget)}
              </h3>
            </CardContent>
         </Card>
      </div>

      {/* CATEGORY SCROLL */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
         {summary.detail_kategori?.map((cat, idx) => (
           <Card key={idx} className="min-w-[200px] bg-primary/5 border-primary/10 snap-start">
             <CardContent className="p-3">
                <p className="text-xs font-bold text-primary/80 truncate uppercase">{cat.name}</p>
                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-semibold">{formatIDR(cat.budget_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terpakai:</span>
                    <span className="font-semibold text-red-400">{formatIDR(cat.total_spent)}</span>
                  </div>
                  <div className="flex justify-between border-t border-primary/10 pt-1 mt-1">
                    <span className="text-muted-foreground">Sisa:</span>
                    <span className="font-bold text-green-400">{formatIDR(cat.budget_amount - cat.total_spent)}</span>
                  </div>
                </div>
                <div className="mt-2 h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((cat.total_spent / cat.budget_amount) * 100, 100)}%` }}
                   ></div>
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-primary/20 h-11 rounded-2xl"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-card border-primary/20 h-11 rounded-2xl w-[160px]">
               <div className="flex items-center gap-2">
                 <LayoutGrid className="w-4 h-4 text-primary" />
                 <SelectValue placeholder="Kategori" />
               </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/20">
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-card border-primary/20 h-11 rounded-2xl w-[150px]">
               <div className="flex items-center gap-2">
                 <Filter className="w-4 h-4 text-primary" />
                 <SelectValue placeholder="Urutkan" />
               </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/20">
              <SelectItem value="date-desc">Terbaru</SelectItem>
              <SelectItem value="date-asc">Terlama</SelectItem>
              <SelectItem value="amount-desc">Nominal Tertinggi</SelectItem>
              <SelectItem value="amount-asc">Nominal Terendah</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : processedTransactions.length > 0 ? (
          processedTransactions.map((t) => (
            <Card key={t.id} className="bg-card/40 border-primary/10 group hover:border-primary/30 transition-all overflow-hidden rounded-2xl">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                    ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'income' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base leading-tight">{t.note || "Tanpa Catatan"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {getCategoryName(t.category_budget_id)}
                      </span>
                      <span>•</span>
                      <span>{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
                  <div className="text-right">
                    <p className={`font-black text-lg whitespace-nowrap flex items-center justify-end ${t.type === 'income' ? 'text-green-500' : 'text-foreground'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                    </p>
                    {t.is_reimbursed ? (
                      <div className="flex items-center justify-end gap-1 text-[10px] text-primary/70 font-bold mt-1 bg-primary/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> REIMBURSE
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="flex gap-1 transition-all">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary" onClick={() => openEdit(t)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => confirmDelete(t)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}

        {processedTransactions.length === 0 && !loading && (
          <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-primary/10 rounded-3xl bg-card/10 flex flex-col items-center gap-3">
             <History className="w-12 h-12 opacity-10" />
             <div className="space-y-1">
               <p className="font-bold text-muted-foreground/60">Tidak Ada Transaksi</p>
               <p className="text-xs">Coba ubah filter atau tambah transaksi baru.</p>
             </div>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="rounded-xl border-primary/20"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="rounded-xl border-primary/20"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION */}
      <AlertDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Transaksi?"
        description="Aksi ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen dari riwayat Anda."
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}

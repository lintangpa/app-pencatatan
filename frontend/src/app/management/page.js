"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronRight, LayoutGrid, CalendarDays, Loader2, Calendar, Search, Filter, CopyPlus, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "@/components/ui/select"
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog-custom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ManagementPage() {
  const [months, setMonths] = useState([]);
  const [selectedMonthId, setSelectedMonthId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Months
  const [monthDate, setMonthDate] = useState(""); // Format: YYYY-MM
  const [maxBudget, setMaxBudget] = useState(""); // Raw value
  const [displayMaxBudget, setDisplayMaxBudget] = useState(""); // Formatted value
  const [editingMonth, setEditingMonth] = useState(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // Filter and Search states
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [searchCat, setSearchCat] = useState("");

  // Delete Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("month"); // 'month' or 'category'

  // Form states for Categories
  const [catName, setCatName] = useState("");
  const [catBudget, setCatBudget] = useState(""); // Raw
  const [displayCatBudget, setDisplayCatBudget] = useState(""); // Formatted
  const [isAddToSavings, setIsAddToSavings] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [selectedSavingsGoalId, setSelectedSavingsGoalId] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [monthPage, setMonthPage] = useState(1);
  const [catPage, setCatPage] = useState(1);

  const getHeaders = () => ({
    "Authorization": localStorage.getItem("token"),
    "Content-Type": "application/json",
  });

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

  const handleBudgetChange = (e, setRaw, setDisplay) => {
    const val = e.target.value;
    const rawValue = val.replace(/\D/g, "");
    setRaw(rawValue);
    setDisplay(toRupiah(rawValue));
  };

  const fetchMonths = async () => {
    try {
      const res = await fetch(`${API_URL}/months`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setMonths(data);
    } catch (err) {
      toast.error("Gagal memuat data bulan");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (monthId) => {
    try {
      const res = await fetch(`${API_URL}/months/${monthId}/categories`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (err) {
      toast.error("Gagal memuat kategori");
      console.error(err);
    }
  };

  const fetchSavingsGoals = async () => {
    try {
      const res = await fetch(`${API_URL}/savings`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setSavingsGoals(data);
    } catch (err) {
      console.error("Gagal memuat tabungan", err);
    }
  };

  useEffect(() => {
    fetchMonths();
    fetchSavingsGoals();
  }, []);

  useEffect(() => {
    if (selectedMonthId) {
      fetchCategories(selectedMonthId);
      setCatPage(1);
    } else {
      setCategories([]);
    }
  }, [selectedMonthId]);

  // MONTH CRUD
  const handleSaveMonth = async (e) => {
    e.preventDefault();
    if (!monthDate) return toast.error("Silakan pilih bulan");
    
    const [year, month] = monthDate.split("-");
    const body = { month: parseInt(month), year: parseInt(year), max_budget: parseFloat(maxBudget) };
    const url = editingMonth ? `${API_URL}/months/${editingMonth.id}` : `${API_URL}/months`;
    const method = editingMonth ? "PUT" : "POST";

    setActionLoading(true);
    try {
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingMonth ? "Budget bulanan diperbarui" : "Budget bulanan ditambahkan");
        fetchMonths();
        setIsMonthModalOpen(false);
        resetMonthForm();
      } else {
        toast.error(data.message || "Gagal menyimpan data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetMonthForm = () => {
    setEditingMonth(null);
    setMonthDate("");
    setMaxBudget("");
    setDisplayMaxBudget("");
  };

  const confirmDeleteMonth = (m) => {
    setItemToDelete(m);
    setDeleteType("month");
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      const url = deleteType === "month" 
        ? `${API_URL}/months/${itemToDelete.id}` 
        : `${API_URL}/categories/${itemToDelete.id}`;
      
      const res = await fetch(url, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        toast.success(deleteType === "month" ? "Budget bulanan berhasil dihapus" : "Kategori berhasil dihapus");
        if (deleteType === "month") {
          if (selectedMonthId === itemToDelete.id) setSelectedMonthId(null);
          fetchMonths();
        } else {
          fetchCategories(selectedMonthId);
        }
        setIsDeleteDialogOpen(false);
      } else {
        toast.error("Gagal menghapus data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
      console.error(err);
    } finally {
      setActionLoading(false);
      setItemToDelete(null);
    }
  };

  const handleToggleActive = (monthId) => {
    if (selectedMonthId === monthId) {
      setSelectedMonthId(null);
    } else {
      setSelectedMonthId(monthId);
    }
  };

  const handleCopyPreviousMonth = async () => {
    if (!selectedMonthId) return;
    
    // Find previous month
    const currentIndex = months.findIndex(m => m.id === selectedMonthId);
    const prevMonth = months[currentIndex + 1];
    
    if (!prevMonth) return toast.error("Tidak ada data bulan sebelumnya untuk disalin");

    setActionLoading(true);
    try {
      // Fetch prev categories
      const res = await fetch(`${API_URL}/months/${prevMonth.id}/categories`, { headers: getHeaders() });
      const prevCats = await res.json();
      
      if (prevCats.length === 0) {
        toast.error("Bulan sebelumnya tidak memiliki kategori");
        return;
      }

      // Create categories in current month
      let successCount = 0;
      for (const cat of prevCats) {
        const createRes = await fetch(`${API_URL}/months/${selectedMonthId}/categories`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ name: cat.name, budget_amount: cat.budget_amount })
        });
        if (createRes.ok) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} kategori berhasil disalin`);
        fetchCategories(selectedMonthId);
      }
    } catch (err) {
      toast.error("Gagal menyalin data");
    } finally {
      setActionLoading(false);
    }
  };

  // CATEGORY CRUD
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    
    const activeMonth = months.find(m => m.id === selectedMonthId);
    const totalCatBudget = categories.reduce((acc, cat) => acc + parseFloat(cat.budget_amount), 0);
    const currentCatAmount = editingCat ? parseFloat(editingCat.budget_amount) : 0;
    const newTotal = totalCatBudget - currentCatAmount + parseFloat(catBudget);

    if (activeMonth && newTotal > activeMonth.max_budget) {
      return toast.error("Budget kategori melebihi sisa budget bulanan!");
    }

    if (isAddToSavings && !selectedSavingsGoalId) {
      return toast.error("Pilih target tabungan terlebih dahulu!");
    }

    const body = { 
      name: catName, 
      budget_amount: parseFloat(catBudget),
      isAddToSavings: isAddToSavings,
      savings_goal_id: isAddToSavings ? selectedSavingsGoalId : null
    };
    const url = editingCat ? `${API_URL}/categories/${editingCat.id}` : `${API_URL}/months/${selectedMonthId}/categories`;
    const method = editingCat ? "PUT" : "POST";

    setActionLoading(true);
    try {
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editingCat ? "Kategori diperbarui" : "Kategori ditambahkan");
        fetchCategories(selectedMonthId);
        setIsCatModalOpen(false);
        resetCatForm();
      } else {
        toast.error("Gagal menyimpan kategori");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetCatForm = () => {
    setEditingCat(null);
    setCatName("");
    setCatBudget("");
    setDisplayCatBudget("");
    setIsAddToSavings(false);
    setSelectedSavingsGoalId("");
  };

  const confirmDeleteCategory = (c) => {
    setItemToDelete(c);
    setDeleteType("category");
    setIsDeleteDialogOpen(true);
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[monthNumber - 1];
  };

  const activeMonth = months.find(m => m.id === selectedMonthId);
  const totalCatBudget = categories.reduce((acc, cat) => acc + parseFloat(cat.budget_amount), 0);
  const remainingBudget = activeMonth ? activeMonth.max_budget - totalCatBudget : 0;

  const filteredMonths = months.filter((m) => !filterYear || m.year.toString() === filterYear);
  const totalMonthPages = Math.ceil(filteredMonths.length / 4);
  const paginatedMonths = filteredMonths.slice((monthPage - 1) * 4, monthPage * 4);

  const filteredCats = categories
    .filter((c) => c.name.toLowerCase().includes(searchCat.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const totalCatPages = Math.ceil(filteredCats.length / 5);
  const paginatedCats = filteredCats.slice((catPage - 1) * 5, catPage * 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 pb-20 text-foreground">
      {/* SECTION MONTH BUDGET */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="text-primary w-6 h-6" />
              Management Budget
            </h2>
            <p className="text-sm text-muted-foreground">Kelola anggaran bulanan dan rincian kategori.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-32">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
              <Input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="Tahun"
                className="pl-9 bg-muted/20 border-primary/20 h-9"
              />
            </div>

            <Dialog open={isMonthModalOpen} onOpenChange={(val) => {
              setIsMonthModalOpen(val);
              if (!val) resetMonthForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full px-5 h-9 font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/80 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1.5" /> Tambah
                </Button>
              </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 text-card-foreground">
                <DialogHeader>
                  <DialogTitle>{editingMonth ? "Edit Budget Bulanan" : "Tambah Budget Bulanan"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveMonth} className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Pilih Bulan & Tahun</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10 pointer-events-none" />
                      <Input 
                        type="month"
                        value={monthDate} 
                        onChange={(e) => setMonthDate(e.target.value)} 
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                        required 
                        className="pl-10 bg-muted/50 border-primary/10 focus:border-primary/40 transition-colors h-11 text-foreground cursor-pointer text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Maksimal Budget (Batas Pengeluaran)</Label>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      value={displayMaxBudget} 
                      onChange={(e) => handleBudgetChange(e, setMaxBudget, setDisplayMaxBudget)} 
                      required 
                      placeholder="Rp0"
                      className="bg-muted/50 border-primary/10 focus:border-primary/40 transition-colors h-11 text-foreground text-base"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-11 font-bold text-lg" disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Simpan Data
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paginatedMonths.map((m) => (
            <Card 
              key={m.id} 
              className={`transition-all duration-300 cursor-pointer overflow-hidden border-2
                ${selectedMonthId === m.id 
                  ? "ring-4 ring-primary/20 border-primary bg-primary/10" 
                  : "border-primary/10 bg-card/40 hover:border-primary/20"}`}
              onClick={() => handleToggleActive(m.id)}
            >
              <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">
                    {getMonthName(m.month)} {m.year}
                  </CardTitle>
                  <CardDescription className="text-primary font-semibold text-base">
                    {formatIDR(m.max_budget)}
                  </CardDescription>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary" 
                    onClick={() => {
                      setEditingMonth(m);
                      setMonthDate(`${m.year}-${String(m.month).padStart(2, '0')}`);
                      const budget = Math.round(m.max_budget).toString();
                      setMaxBudget(budget);
                      setDisplayMaxBudget(toRupiah(budget));
                      setIsMonthModalOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive" 
                    onClick={() => confirmDeleteMonth(m)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              {selectedMonthId === m.id && (
                <div className="px-5 pb-3">
                  <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse w-full"></div>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {months.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5 flex flex-col items-center gap-2">
              <CalendarDays className="w-10 h-10 opacity-20" />
              <p>Belum ada budget bulanan yang dibuat.</p>
              <p className="text-xs">Klik "Tambah" untuk merencanakan keuanganmu.</p>
            </div>
          )}
        </div>

        {totalMonthPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="icon"
              disabled={monthPage === 1}
              onClick={() => setMonthPage(p => p - 1)}
              className="rounded-xl border-primary/20 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium">
              Halaman {monthPage} dari {totalMonthPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={monthPage === totalMonthPages}
              onClick={() => setMonthPage(p => p + 1)}
              className="rounded-xl border-primary/20 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>

      {/* SECTION CATEGORY BUDGET */}
      <section className="space-y-6 border-t border-primary/10 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LayoutGrid className="text-primary w-5 h-5" />
              Rincian Kategori
            </h2>
            {selectedMonthId && (
              <div className="flex flex-col gap-1">
                <p className={`text-xs font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-primary/80'}`}>
                  Sisa Budget Alokasi: {formatIDR(remainingBudget)}
                </p>
              </div>
            )}
          </div>
          
          {selectedMonthId && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <Input
                  placeholder="Cari kategori..."
                  value={searchCat}
                  onChange={(e) => { setSearchCat(e.target.value); setCatPage(1); }}
                  className="pl-9 bg-muted/20 border-primary/20 h-9"
                />
              </div>

              {categories.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyPreviousMonth}
                  className="rounded-full px-4 h-9 border-primary/20 hover:bg-primary/10 text-primary flex items-center gap-1.5"
                  disabled={actionLoading}
                >
                  <CopyPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy Sebelumnya</span>
                </Button>
              )}

              <Dialog open={isCatModalOpen} onOpenChange={(val) => {
                setIsCatModalOpen(val);
                if (!val) resetCatForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full px-5 h-9 font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/80 text-primary-foreground">
                    <Plus className="w-4 h-4 mr-1" /> Kategori
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 text-card-foreground">
                  <DialogHeader>
                    <DialogTitle>{editingCat ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveCategory} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nama Kategori</Label>
                      <Input 
                        value={catName} 
                        onChange={(e) => setCatName(e.target.value)} 
                        required 
                        placeholder="misal: Makan & Jajan"
                        className="bg-muted/50 border-primary/10 h-11 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Budget Maksimal Kategori</Label>
                      <Input 
                        type="text" 
                        inputMode="numeric"
                        value={displayCatBudget} 
                        onChange={(e) => handleBudgetChange(e, setCatBudget, setDisplayCatBudget)} 
                        required 
                        placeholder="Rp0"
                        className="bg-muted/50 border-primary/10 h-11 text-base"
                      />
                    </div>
                    {!editingCat && (
                      <>
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id="addToSavings"
                            checked={isAddToSavings}
                            onChange={(e) => setIsAddToSavings(e.target.checked)}
                            className="w-4 h-4 rounded border-primary text-primary focus:ring-primary accent-primary"
                          />
                          <Label htmlFor="addToSavings" className="text-sm font-medium leading-none cursor-pointer">
                            Masukkan ke dalam Savings?
                          </Label>
                        </div>

                        {isAddToSavings && (
                          <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1">
                            <Label className="text-muted-foreground">Pilih Tabungan (Savings Goal)</Label>
                            <Select 
                              value={selectedSavingsGoalId} 
                              onValueChange={setSelectedSavingsGoalId}
                            >
                              <SelectTrigger className="bg-muted/50 border-primary/10 h-11 text-base">
                                <SelectValue placeholder="Pilih target tabungan..." />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-primary/20">
                                {savingsGoals.length > 0 ? (
                                  savingsGoals.map(sg => (
                                    <SelectItem key={sg.id} value={sg.id.toString()}>
                                      {sg.name} ({formatIDR(sg.current_amount)})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-xs text-muted-foreground italic">
                                    Belum ada target tabungan yang dibuat.
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                    <DialogFooter>
                      <Button type="submit" className="w-full h-11 font-bold" disabled={actionLoading}>
                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Kategori
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {!selectedMonthId ? (
          <div className="py-20 text-center text-muted-foreground bg-muted/10 rounded-3xl border border-primary/5 flex flex-col items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                <ChevronRight className="text-primary/30 w-6 h-6" />
             </div>
             <p className="font-medium">Pilih bulan di atas untuk mengelola kategori budget.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {paginatedCats.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-card/40 rounded-2xl border border-primary/10 group hover:shadow-lg hover:border-primary/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ChevronRight className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{c.name}</p>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                        {activeMonth ? ((c.budget_amount / activeMonth.max_budget) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatIDR(c.budget_amount)}</p>
                  </div>
                </div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 text-primary" onClick={() => {
                    setEditingCat(c); 
                    setCatName(c.name); 
                    const budget = Math.round(c.budget_amount).toString();
                    setCatBudget(budget);
                    setDisplayCatBudget(toRupiah(budget));
                    setIsCatModalOpen(true);
                  }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => confirmDeleteCategory(c)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                Belum ada rincian kategori untuk bulan ini.
              </div>
            )}
          </div>
        )}

        {selectedMonthId && totalCatPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="icon"
              disabled={catPage === 1}
              onClick={() => setCatPage(p => p - 1)}
              className="rounded-xl border-primary/20 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium">
              Halaman {catPage} dari {totalCatPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={catPage === totalCatPages}
              onClick={() => setCatPage(p => p + 1)}
              className="rounded-xl border-primary/20 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={deleteType === "month" ? "Hapus Budget Bulanan?" : "Hapus Kategori?"}
        description={
          deleteType === "month" 
            ? `Menghapus bulan ${itemToDelete ? `${getMonthName(itemToDelete.month)} ${itemToDelete.year}` : ''} akan menghapus SELURUH data kategori dan transaksi yang ada di dalamnya secara permanen.`
            : `Apakah Anda yakin ingin menghapus kategori "${itemToDelete?.name}"?`
        }
        onConfirm={handleDeleteItem}
        loading={actionLoading}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronRight, LayoutGrid, CalendarDays, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog-custom";

const API_URL = "http://localhost:3001/api";

export default function ManagementPage() {
  const [months, setMonths] = useState([]);
  const [selectedMonthId, setSelectedMonthId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Months
  const [monthDate, setMonthDate] = useState(""); // Format: YYYY-MM
  const [maxBudget, setMaxBudget] = useState("");
  const [editingMonth, setEditingMonth] = useState(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // Delete Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form states for Categories
  const [catName, setCatName] = useState("");
  const [catBudget, setCatBudget] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const getHeaders = () => ({
    "Authorization": localStorage.getItem("token"),
    "Content-Type": "application/json",
  });

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
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

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (selectedMonthId) {
      fetchCategories(selectedMonthId);
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
  };

  const confirmDeleteMonth = (m) => {
    setItemToDelete(m);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMonth = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/months/${itemToDelete.id}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        toast.success("Budget bulanan berhasil dihapus");
        if (selectedMonthId === itemToDelete.id) setSelectedMonthId(null);
        fetchMonths();
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

  // CATEGORY CRUD
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const body = { name: catName, budget_amount: parseFloat(catBudget) };
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
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        toast.success("Kategori dihapus");
        fetchCategories(selectedMonthId);
      }
    } catch (err) {
      toast.error("Gagal menghapus kategori");
      console.error(err);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[monthNumber - 1];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 pb-20">
      {/* SECTION MONTH BUDGET */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <CalendarDays className="text-primary w-5 h-5" />
            Management Budget
          </h2>
          <Dialog open={isMonthModalOpen} onOpenChange={(val) => {
            setIsMonthModalOpen(val);
            if (!val) resetMonthForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full px-4 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/20">
              <DialogHeader>
                <DialogTitle>{editingMonth ? "Edit Budget Bulanan" : "Tambah Budget Bulanan"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveMonth} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pilih Bulan & Tahun</Label>
                  <Input 
                    type="month" 
                    value={monthDate} 
                    onChange={(e) => setMonthDate(e.target.value)} 
                    required 
                    className="bg-muted/50 border-primary/10 focus:border-primary/40 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maksimal Budget (Batas Pengeluaran)</Label>
                  <Input 
                    type="number" 
                    value={maxBudget} 
                    onChange={(e) => setMaxBudget(e.target.value)} 
                    required 
                    placeholder="misal: 5000000"
                    className="bg-muted/50 border-primary/10 focus:border-primary/40 transition-colors"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-10" disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {months.map((m) => (
            <Card 
              key={m.id} 
              className={`transition-all duration-300 cursor-pointer overflow-hidden border-2
                ${selectedMonthId === m.id 
                  ? "ring-4 ring-primary/10 border-primary bg-primary/[0.03]" 
                  : "border-primary/5 bg-card/40 hover:border-primary/20"}`}
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
                    className="h-9 w-9 rounded-full bg-primary/5 hover:bg-primary/10 text-primary" 
                    onClick={() => {
                      setEditingMonth(m);
                      setMonthDate(`${m.year}-${String(m.month).padStart(2, '0')}`);
                      setMaxBudget(m.max_budget);
                      setIsMonthModalOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full bg-destructive/5 hover:bg-destructive/10 text-destructive" 
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
      </section>

      {/* SECTION CATEGORY BUDGET */}
      <section className="space-y-4 border-t border-primary/10 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutGrid className="text-primary w-5 h-5" />
            Rincian Kategori
          </h2>
          {selectedMonthId && (
            <Dialog open={isCatModalOpen} onOpenChange={(val) => {
              setIsCatModalOpen(val);
              if (!val) resetCatForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5" onClick={() => resetCatForm()}>
                  <Plus className="w-4 h-4 mr-1" /> Kategori
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle>{editingCat ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveCategory} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nama Kategori</Label>
                    <Input 
                      value={catName} 
                      onChange={(e) => setCatName(e.target.value)} 
                      required 
                      placeholder="misal: Makan & Jajan"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Maksimal Kategori</Label>
                    <Input 
                      type="number" 
                      value={catBudget} 
                      onChange={(e) => setCatBudget(e.target.value)} 
                      required 
                      placeholder="misal: 1500000"
                      className="bg-muted/50"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Kategori
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10 group hover:shadow-md hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{c.name}</p>
                    <p className="text-xs font-semibold text-primary">{formatIDR(c.budget_amount)}</p>
                  </div>
                </div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/5" onClick={() => {
                    setEditingCat(c); setCatName(c.name); setCatBudget(c.budget_amount);
                    setIsCatModalOpen(true);
                  }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/5 text-destructive" onClick={() => handleDeleteCategory(c.id)}>
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
      </section>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Budget Bulanan?"
        description={`Menghapus bulan ${itemToDelete ? `${getMonthName(itemToDelete.month)} ${itemToDelete.year}` : ''} akan menghapus SELURUH data kategori dan transaksi yang ada di dalamnya secara permanen.`}
        onConfirm={handleDeleteMonth}
        loading={actionLoading}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from "@/app/actions";
import type { SavingsGoalRow } from "@/lib/supabase/types";
import { Loader2, Trash2 } from "lucide-react";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";

interface GoalDialogProps {
  goal: SavingsGoalRow | null; // null for add mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalDialog({ goal, open, onOpenChange }: GoalDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
    emoji: "🎯",
  });

  // Reset or populate form when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      if (goal) {
        setFormData({
          name: goal.name,
          target_amount: goal.target_amount.toString(),
          current_amount: goal.current_amount.toString(),
          target_date: goal.target_date,
          emoji: goal.emoji,
        });
      } else {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setFormData({
          name: "",
          target_amount: "",
          current_amount: "0",
          target_date: nextYear.toISOString().slice(0, 10),
          emoji: "🎯",
        });
      }
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const values = {
      name: formData.name,
      target_amount: Number(formData.target_amount.replace(/[^0-9]/g, "")),
      current_amount: Number(formData.current_amount.replace(/[^0-9]/g, "")),
      target_date: formData.target_date,
      emoji: formData.emoji,
    };

    if (!values.name || !values.target_amount || !values.target_date) {
      setError("Mohon lengkapi semua field yang wajib.");
      setLoading(false);
      return;
    }

    try {
      let res;
      if (goal) {
        res = await updateSavingsGoal(goal.id, values);
      } else {
        res = await addSavingsGoal(values);
      }

      if (!res.success) {
        throw new Error(res.error || "Terjadi kesalahan.");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !window.confirm("Apakah Anda yakin ingin menghapus target ini?")) return;
    
    setDeleting(true);
    setError(null);
    try {
      const res = await deleteSavingsGoal(goal.id);
      if (!res.success) {
        throw new Error(res.error || "Gagal menghapus.");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAmountChange = (key: "target_amount" | "current_amount", value: string) => {
    const raw = value.replace(/[^0-9]/g, "");
    setFormData(prev => ({ ...prev, [key]: raw }));
  };

  const formatRupiah = (val: string) => {
    if (!val) return "";
    return new Intl.NumberFormat("id-ID").format(Number(val));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showHandle className="p-0 overflow-hidden rounded-t-[28px] md:rounded-[32px] bg-white border border-black/[0.04] shadow-2xl max-w-md w-full mx-auto">
        <DialogHeader className="p-6 pb-4 border-b border-stone-100 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D8F5A2] text-stone-900 shadow-xs">
              <AnimatedEmoji emoji={formData.emoji || "🎯"} size={22} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#18181B]">
                {goal ? "Edit Target Tabungan" : "Tambah Target Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 mt-0.5">
                {goal ? "Perbarui jumlah uang terkumpul atau target." : "Buat target finansial baru Anda."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 overflow-y-auto max-h-[76vh] sm:max-h-[550px] custom-scrollbar">
          <div className="space-y-4 pt-0.5 pb-2">
            
            {/* Emoji and Name Row */}
            <div className="flex gap-2.5">
              <div className="space-y-1.5 w-[76px] shrink-0">
                <Label htmlFor="emoji" className="text-xs font-semibold text-stone-500">Emoji</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                  className="h-11 text-xl text-center rounded-2xl bg-surface-muted/60 border-stone-200/50 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label htmlFor="name" className="text-xs font-semibold text-stone-500">Nama Target</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mis: Dana Darurat, Beli Laptop"
                  className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Target Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="target_amount" className="text-xs font-semibold text-stone-500">Target Nominal</Label>
              <div className="relative flex items-center rounded-2xl bg-surface-muted/60 border border-stone-200/50 p-1 focus-within:ring-2 focus-within:ring-black/10 focus-within:bg-white transition-all">
                <span className="pl-3 text-sm font-bold text-stone-400">
                  Rp
                </span>
                <Input
                  id="target_amount"
                  inputMode="numeric"
                  value={formatRupiah(formData.target_amount)}
                  onChange={(e) => handleAmountChange("target_amount", e.target.value)}
                  placeholder="0"
                  className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-2xl h-10 text-[#18181B] tabular-nums bg-transparent pr-2"
                />
              </div>
            </div>

            {/* Current Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="current_amount" className="text-xs font-semibold text-stone-500">Uang Terkumpul</Label>
              <div className="relative flex items-center rounded-2xl bg-surface-muted/60 border border-stone-200/50 p-1 focus-within:ring-2 focus-within:ring-black/10 focus-within:bg-white transition-all">
                <span className="pl-3 text-sm font-bold text-stone-400">
                  Rp
                </span>
                <Input
                  id="current_amount"
                  inputMode="numeric"
                  value={formatRupiah(formData.current_amount)}
                  onChange={(e) => handleAmountChange("current_amount", e.target.value)}
                  placeholder="0"
                  className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-lg h-9 text-[#18181B] tabular-nums bg-transparent pr-2"
                />
              </div>
            </div>

            {/* Target Date */}
            <div className="space-y-1.5">
              <Label htmlFor="target_date" className="text-xs font-semibold text-stone-500">Tenggat Target</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
              />
            </div>

            {error && <p className="text-[11px] font-medium text-[#E85024] mt-2">{error}</p>}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {goal && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full sm:w-auto h-12 rounded-full font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer text-sm" 
                onClick={handleDelete}
                disabled={loading || deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                Hapus
              </Button>
            )}
            <div className="flex-1 hidden sm:block" />
            <Button 
              type="submit" 
              className="w-full sm:w-auto h-12 rounded-full font-bold bg-[#E85024] hover:bg-[#d44319] text-white px-6 cursor-pointer shadow-sm text-sm transition-all active:scale-[0.99]" 
              disabled={loading || deleting}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal ? "Simpan Perubahan" : "Buat Target"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


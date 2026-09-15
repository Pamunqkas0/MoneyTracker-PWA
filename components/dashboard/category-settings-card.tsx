"use client";

import { useState, useEffect } from "react";
import { Tags, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import { cn } from "@/lib/utils";
import fluentEmojisKeys from "@/lib/fluent-emojis-keys.json";
import { updateCategory, deleteCategory } from "@/app/actions";
import type { CategoryRow } from "@/lib/supabase/types";

const EMOJI_OPTIONS = fluentEmojisKeys as string[];

interface CategorySettingsCardProps {
  categories: CategoryRow[];
}

export function CategorySettingsCard({ categories }: CategorySettingsCardProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [visibleEmojiCount, setVisibleEmojiCount] = useState(60);

  // Form states
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editColor, setEditColor] = useState("");

  const userCategories = categories.filter((c) => !c.is_system);

  const handleEditClick = (category: CategoryRow) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditEmoji(category.emoji);
    setEditColor(category.color || "#10b981"); // Default emerald
    setErrorMsg("");
    setVisibleEmojiCount(60); // Reset count
    setIsEditDialogOpen(true);
  };

  const handleEmojiScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleEmojiCount((prev) => Math.min(prev + 60, EMOJI_OPTIONS.length));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    
    setErrorMsg("");

    if (!editName.trim()) {
      setErrorMsg("Nama kategori tidak boleh kosong");
      return;
    }

    if (!editEmoji.trim()) {
      setErrorMsg("Emoji tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCategory(editingCategory.id, {
        name: editName,
        emoji: editEmoji,
        color: editColor,
      });

      if (result.success) {
        setIsEditDialogOpen(false);
        setSuccessMsg("Kategori berhasil diperbarui");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(result.error || "Gagal memperbarui kategori");
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (category: CategoryRow) => {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return;

    setIsLoading(true);
    try {
      const result = await deleteCategory(category.id);
      if (result.success) {
        setSuccessMsg("Kategori berhasil dihapus");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(result.error || "Gagal menghapus kategori");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-black/[0.03] shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#FAD170] flex items-center justify-center text-amber-900 shadow-2xs shrink-0">
            <Tags className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#18181B]">Kelola Kategori Kustom</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Edit atau hapus kategori kustom tambahan Anda
            </p>
          </div>
        </div>

        <div className="pt-1 space-y-3">
          {successMsg && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-3 text-emerald-800 text-xs font-bold text-center">
              {successMsg}
            </div>
          )}

          {userCategories.length === 0 ? (
            <div className="text-center py-6 text-stone-400 bg-surface-muted/30 rounded-2xl border border-dashed border-stone-200 p-4">
              <Tags className="h-7 w-7 mx-auto mb-1.5 opacity-30 text-stone-600" />
              <p className="text-xs font-medium">Belum ada kategori kustom tambahan</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {userCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-surface-muted/40 hover:bg-surface-muted/70 transition-all border border-black/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs">
                      <AnimatedEmoji emoji={category.emoji} size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#18181B] truncate leading-tight">
                        {category.name}
                      </h4>
                      <span
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wider",
                          category.type === "income"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-[#FDD5C1] text-rose-800"
                        )}
                      >
                        {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-all cursor-pointer"
                      onClick={() => handleEditClick(category)}
                      disabled={isLoading}
                      title="Edit Kategori"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      onClick={() => handleDelete(category)}
                      disabled={isLoading}
                      title="Hapus Kategori"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent showHandle className="p-0 overflow-hidden rounded-t-[32px] sm:rounded-[36px] transition-all duration-200 max-w-md bg-white border border-black/[0.04] shadow-2xl">
          <DialogHeader className="p-6 pb-3 border-b border-black/[0.04] text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAD170] flex items-center justify-center text-amber-900 shadow-2xs">
                <Tags className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#18181B]">
                  Edit Kategori
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 mt-0.5">
                  Perbarui nama dan emoji kategori kustom Anda
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pt-4 pb-0 overflow-y-auto max-h-[70vh] sm:max-h-[500px]">
            <div className="space-y-4 pb-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-bold text-stone-700">Nama Kategori</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Mis. Makan Malam"
                  className="rounded-2xl h-11 text-xs font-bold bg-surface-muted/60 border-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700">Pilih Emoji</Label>
                <div
                  className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-1 bg-surface-muted/40 rounded-2xl border border-black/[0.02]"
                  onScroll={handleEmojiScroll}
                >
                  {EMOJI_OPTIONS.slice(0, visibleEmojiCount).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditEmoji(emoji)}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-xl border text-base transition-all cursor-pointer",
                        editEmoji === emoji
                          ? "border-[#E85024] bg-orange-50 shadow-2xs scale-105"
                          : "border-black/[0.04] bg-white hover:bg-stone-50"
                      )}
                    >
                      <AnimatedEmoji emoji={emoji} size={22} />
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="text-rose-700 text-xs font-bold bg-rose-50 p-3 rounded-2xl text-center border border-rose-200">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 p-6 pt-3 bg-white border-t border-black/[0.04] flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
              className="flex-1 rounded-full h-11 font-bold text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="flex-1 rounded-full h-11 font-bold text-xs bg-[#E85024] hover:bg-[#d44319] text-white shadow-xs cursor-pointer"
            >
              {isLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

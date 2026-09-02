"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, FolderTree, X, Loader2, Image as ImageIcon, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/product";

export default function CategoriesManagerClient({ initialCategories }: { initialCategories: any[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800");
  const [order, setOrder] = useState<number>(0);

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setImage("https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800");
    setOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setImage(cat.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800");
    setOrder(cat.order || 0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم القسم.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name,
          description,
          image,
          order: Number(order),
        });
        toast.success("تم تحديث بيانات القسم بنجاح!");
      } else {
        await createCategory({
          name,
          description,
          image,
          order: Number(order),
        });
        toast.success("تمت إضافة القسم الجديد بنجاح!");
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ القسم.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`هل أنت متأكد من حذف قسم "${catName}"؟`)) return;

    try {
      await deleteCategory(id);
      toast.success("تم حذف/تعطيل القسم بنجاح.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف القسم.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-orange-500 text-black font-extrabold text-xs flex items-center gap-1.5 hover:scale-105 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم رئيسي جديد +</span>
        </button>

        <span className="text-xs text-gray-400 font-mono">
          إجمالي الأقسام: {categories.length}
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-[#12161f] border border-gray-800 hover:border-orange-500/30 transition flex flex-col justify-between space-y-4 group"
          >
            <div className="flex items-start gap-3.5">
              <img
                src={c.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800"}
                alt={c.name}
                className="w-14 h-14 rounded-xl object-cover border border-gray-700 shrink-0"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {c.isActive ? "نشط" : "معطل"}
                  </span>
                </div>
                <span className="text-[10px] text-orange-500 font-mono block">
                  /{c.slug} ({c._count?.products || 0} منتج)
                </span>
                {c.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/80 text-[11px]">
              <span className="text-gray-500 font-mono">الترتيب: {c.order}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-1.5 rounded-lg bg-[#1a202c] hover:bg-orange-500/10 text-gray-300 hover:text-orange-500 border border-gray-700 transition"
                  title="تعديل القسم"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                  title="حذف القسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-orange-500" />
                <span>{editingCategory ? "تعديل بيانات القسم" : "إضافة قسم رئيسي جديد"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">اسم القسم *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سيارات دريفت وسرعة W16"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الوصف التوضيحي للقسم</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر لمحتويات هذا القسم..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                />
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-[#0a0d13] border border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-200">صورة أو أيقونة القسم (Cloudinary CDN)</label>
                  <label className={`px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 shrink-0 ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? "جاري الرفع لـ CDN..." : "رفع صورة من جهازك"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("حجم الصورة كبير، الحد الأقصى 10 ميجابايت.");
                          return;
                        }
                        const formData = new FormData();
                        formData.append("file", file);
                        setIsUploading(true);
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const data = await res.json();
                          if (!res.ok || !data.url) throw new Error(data.message || "فشل الرفع.");
                          setImage(data.url);
                          toast.success("تم رفع صورة القسم إلى Cloudinary CDN بنجاح! 🚀");
                        } catch (err: any) {
                          toast.error(err.message || "فشل رفع الصورة.");
                        } finally {
                          setIsUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-gray-700 overflow-hidden bg-black/50 shrink-0 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="أو ضع رابط صورة مباشر..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-left dir-ltr font-mono"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="الترتيب"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-center font-mono"
                      title="ترتيب ظهور القسم"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-extrabold text-xs transition disabled:opacity-50"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ القسم"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

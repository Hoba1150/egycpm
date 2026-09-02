"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { createProduct, updateProduct, deleteProduct, toggleProductActive, getAdminProductDetails } from "@/lib/actions/product";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Car,
  Zap,
  Image as ImageIcon,
  Flame,
  Star,
  Sparkles,
  X,
  Upload,
  Loader2,
  Search,
  FolderTree,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Gamepad2,
  Key,
} from "lucide-react";

export default function ProductManagerClient({
  initialProducts,
  categories,
}: {
  initialProducts: any[];
  categories: any[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Product Type Selector: "REGULAR" vs "GAME_ACCOUNT"
  const [productTypeKind, setProductTypeKind] = useState<"REGULAR" | "GAME_ACCOUNT">("REGULAR");
  const [gameAccountEmail, setGameAccountEmail] = useState("");
  const [gameAccountPassword, setGameAccountPassword] = useState("");
  const [gameAccountNotes, setGameAccountNotes] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">(150);
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">(0);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [stockType, setStockType] = useState("UNLIMITED");
  const [stockQuantity, setStockQuantity] = useState<number | "">(999);
  const [deliveryTimeMinutes, setDeliveryTimeMinutes] = useState<number | "">(10);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isLimited, setIsLimited] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProductId(null);
    setProductTypeKind("REGULAR");
    setGameAccountEmail("");
    setGameAccountPassword("");
    setGameAccountNotes("");
    setName("");
    setDescription("");
    setPrice(150);
    setOriginalPrice("");
    setDiscountPercent(0);
    setCategoryId(categories[0]?.id || "");
    setStockType("UNLIMITED");
    setStockQuantity(999);
    setDeliveryTimeMinutes(10);
    setImagesList(["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800"]);
    setNewImageUrl("");
    setIsFeatured(false);
    setIsBestSeller(false);
    setIsLimited(false);
    setIsModalOpen(true);
  };

  const openEditModal = async (p: any) => {
    setEditingProductId(p.id);
    const isGameAcc = p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted);
    setProductTypeKind(isGameAcc ? "GAME_ACCOUNT" : "REGULAR");
    setGameAccountEmail("");
    setGameAccountPassword("");
    setGameAccountNotes("");

    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    setOriginalPrice(p.originalPrice || "");
    setDiscountPercent(p.discountPercent || 0);
    setCategoryId(p.categoryId);
    setStockType(p.stockType || "UNLIMITED");
    setStockQuantity(p.stockQuantity || 1);
    setDeliveryTimeMinutes(p.deliveryTimeMinutes || 10);

    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(p.images);
      if (!Array.isArray(parsedImages)) parsedImages = [p.images];
    } catch {
      parsedImages = p.images ? [p.images] : [];
    }
    if (parsedImages.length === 0) {
      parsedImages = ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800"];
    }
    setImagesList(parsedImages);
    setNewImageUrl("");
    setIsFeatured(p.isFeatured);
    setIsBestSeller(p.isBestSeller);
    setIsLimited(p.isLimited || p.stockType === "ONE_OF_ONE" || p.stockType === "LIMITED");
    setIsModalOpen(true);

    if (isGameAcc) {
      try {
        const details = await getAdminProductDetails(p.id);
        if (details?.gameAccountData) {
          setGameAccountEmail(details.gameAccountData.email || "");
          setGameAccountPassword(details.gameAccountData.password || "");
          setGameAccountNotes(details.gameAccountData.notes || "");
        }
      } catch {
        // ignore
      }
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImagesList([...imagesList, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    if (imagesList.length <= 1) {
      toast.error("يجب أن يحتوي المنتج على صورة واحدة على الأقل.");
      return;
    }
    setImagesList(imagesList.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const selected = imagesList[index];
    const remaining = imagesList.filter((_, i) => i !== index);
    setImagesList([selected, ...remaining]);
    toast.success("تم تعيين الصورة كصورة رئيسية للمنتج.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم المنتج.");
      return;
    }

    if (imagesList.length === 0) {
      toast.error("يرجى إضافة صورة واحدة على الأقل للمنتج.");
      return;
    }

    const isGameAcc = productTypeKind === "GAME_ACCOUNT";

    if (isGameAcc && !editingProductId) {
      if (!gameAccountEmail.trim() && !gameAccountPassword.trim()) {
        toast.error("يرجى إدخال بيانات حساب اللعبة (البريد الإلكتروني أو كلمة المرور).");
        return;
      }
    }

    setIsSaving(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const inferredType = selectedCat?.slug?.includes("service")
        ? "SERVICE"
        : selectedCat?.slug?.includes("account")
        ? "ACCOUNT"
        : "MODIFIED_CAR";

      const finalProductType = isGameAcc ? "GAME_ACCOUNT" : inferredType;
      const finalStockType = isGameAcc ? "ONE_OF_ONE" : stockType;
      const finalStockQty = isGameAcc ? 1 : Number(stockQuantity || 999);
      const finalDeliveryTime = isGameAcc ? 0 : Number(deliveryTimeMinutes || 10);
      const gameAccountData = isGameAcc
        ? {
            email: gameAccountEmail.trim(),
            password: gameAccountPassword,
            notes: gameAccountNotes.trim(),
          }
        : undefined;

      if (editingProductId) {
        const res = await updateProduct(editingProductId, {
          name,
          description,
          price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : null,
          discountPercent: Number(discountPercent || 0),
          categoryId,
          productType: finalProductType,
          stockType: finalStockType,
          stockQuantity: finalStockQty,
          deliveryTimeMinutes: finalDeliveryTime,
          images: imagesList,
          isFeatured,
          isBestSeller,
          isLimited: isGameAcc ? true : isLimited,
          gameAccountData,
        });
        if (res?.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProductId ? { ...p, ...res.product, category: selectedCat } : p))
          );
        }
        toast.success("تم تحديث بيانات المنتج وصوره بنجاح!");
      } else {
        const res = await createProduct({
          name,
          description,
          price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : null,
          discountPercent: Number(discountPercent || 0),
          categoryId,
          productType: finalProductType,
          stockType: finalStockType,
          stockQuantity: finalStockQty,
          deliveryTimeMinutes: finalDeliveryTime,
          images: imagesList,
          isFeatured,
          isBestSeller,
          isLimited: isGameAcc ? true : isLimited,
          gameAccountData,
        });
        if (res?.product) {
          setProducts((prev) => [{ ...res.product, category: selectedCat }, ...prev]);
        }
        toast.success("تمت إضافة المنتج الجديد وصوره بنجاح!");
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ المنتج.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, name: string, isActive: boolean) => {
    // Instant optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p))
    );
    try {
      await toggleProductActive(id);
      toast.success(isActive ? `تم تعطيل "${name}" بنجاح.` : `تم تفعيل "${name}" بنجاح.`);
      router.refresh();
    } catch (err: any) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p))
      );
      toast.error(err.message || "فشل تغيير حالة المنتج.");
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`⚠️ حذف نهائي لا يمكن التراجع عنه!\n\nهل أنت متأكد من حذف "${prodName}" نهائياً من قاعدة البيانات؟`)) return;

    const previousProducts = [...products];
    // Instant optimistic deletion from UI
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteProduct(id);
      toast.success("تم حذف المنتج نهائياً.");
      router.refresh();
    } catch (err: any) {
      // Revert on error
      setProducts(previousProducts);
      toast.error(err.message || "فشل حذف المنتج.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs flex items-center gap-1.5 hover:scale-105 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج أو سيارة جديدة +</span>
        </button>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ابحث عن منتج بالاسم أو الوصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
          />
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-garage-950/80 text-gray-400 font-bold">
                <th className="p-4">المنتج وال работа</th>
                <th className="p-4">القسم</th>
                <th className="p-4">السعر</th>
                <th className="p-4">الخصم</th>
                <th className="p-4">المخزون</th>
                <th className="p-4">المبيعات</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map((p) => {
                let images = [];
                try {
                  images = JSON.parse(p.images);
                  if (!Array.isArray(images)) images = [p.images];
                } catch {
                  images = [p.images];
                }

                return (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-gray-700 shrink-0 bg-black/40">
                          <img
                            src={images[0] || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=100"}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          {images.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-orange-500 text-black text-[9px] font-bold px-1 rounded-tl">
                              +{images.length - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white block">{p.name}</span>
                            {(p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted)) && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[9px] border border-purple-500/30">
                                🎮 حساب
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">/{p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[11px] font-bold">
                        {p.category?.name || "بدون قسم"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-sm text-green-400 font-mono">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="p-4">
                      {p.discountPercent > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">
                          {p.discountPercent}% خصم
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-gray-300">
                      {(p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted)) && (!p.isActive || p.stockQuantity <= 0) ? (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-black text-[10px] border border-red-500/40 shadow-sm inline-flex items-center gap-1">
                          <span>تم البيع</span>
                          <span>⛔</span>
                        </span>
                      ) : p.stockType === "ONE_OF_ONE" ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[10px] border border-red-500/30 inline-flex items-center gap-1">
                          <span dir="ltr" className="inline-block font-mono">1 of 1</span>
                          <span>🔥</span>
                        </span>
                      ) : p.stockType === "LIMITED" || p.isLimited ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold text-[10px] border border-purple-500/30">
                          محدود ({p.stockQuantity}) 💎
                        </span>
                      ) : p.stockType === "QUANTITY" ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] border border-blue-500/30">
                          {p.stockQuantity} قطعة
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">غير محدود ♾️</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-white">{p.totalSales}</td>
                    <td className="p-4">
                      {(p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted)) && (!p.isActive || p.stockQuantity <= 0) ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                          تم البيع 🔥
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                          {p.isActive ? "نشط" : "معطل"}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-[#1a202c] hover:bg-orange-500/10 text-gray-300 hover:text-orange-500 border border-gray-700 transition"
                          title="تعديل المنتج"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(p.id, p.name, p.isActive)}
                          className={`p-1.5 rounded-lg border transition ${p.isActive ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-700/40 hover:bg-gray-700/60 text-gray-400 border-gray-600 hover:text-white"}`}
                          title={p.isActive ? "تعطيل المنتج" : "تفعيل المنتج"}
                        >
                          {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                          title="حذف نهائي للمنتج"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal with Multi-Image Management */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-2xl w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-500" />
                <span>{editingProductId ? "تعديل بيانات المنتج وصوره" : "إضافة منتج أو سيارة جديدة"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Product Type Selector */}
              <div className="p-3.5 rounded-xl bg-[#12161f] border border-orange-500/20 space-y-2">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>نوع المنتج (Product Type) *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProductTypeKind("REGULAR")}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      productTypeKind === "REGULAR"
                        ? "bg-orange-500/20 border-orange-500 text-white font-bold"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div>
                      <span className="text-xs block">📦 منتج عادي</span>
                      <span className="text-[10px] text-gray-400 font-normal">سيارة، تعديل، كوينز، أو خدمة</span>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${productTypeKind === "REGULAR" ? "border-orange-500 bg-orange-500" : "border-gray-600"}`}>
                      {productTypeKind === "REGULAR" && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductTypeKind("GAME_ACCOUNT");
                      setStockType("ONE_OF_ONE");
                      setStockQuantity(1);
                      setIsLimited(true);
                      setDeliveryTimeMinutes(0);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      productTypeKind === "GAME_ACCOUNT"
                        ? "bg-purple-500/20 border-purple-500 text-white font-bold"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div>
                      <span className="text-xs block text-purple-300">🎮 حساب لعبة (تسليم فوري مشفر)</span>
                      <span className="text-[10px] text-gray-400 font-normal">تسليم آلي للعميل فور نجاح الدفع</span>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${productTypeKind === "GAME_ACCOUNT" ? "border-purple-500 bg-purple-500" : "border-gray-600"}`}>
                      {productTypeKind === "GAME_ACCOUNT" && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </span>
                  </button>
                </div>
              </div>

              {/* Game Account Credentials Fields */}
              {productTypeKind === "GAME_ACCOUNT" && (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>بيانات حساب اللعبة (تُشفر آلياً ولا تُسلم للعميل إلا بعد الدفع)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        البريد الإلكتروني / اسم المستخدم للحساب *
                      </label>
                      <input
                        type="text"
                        value={gameAccountEmail}
                        onChange={(e) => setGameAccountEmail(e.target.value)}
                        placeholder="game-account@example.com"
                        className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        كلمة مرور الحساب (Game Password) *
                      </label>
                      <input
                        type="text"
                        value={gameAccountPassword}
                        onChange={(e) => setGameAccountPassword(e.target.value)}
                        placeholder="كلمة مرور الحساب..."
                        className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      ملاحظات أو كود استرداد إضافي (تظهر للعميل مع البيانات)
                    </label>
                    <textarea
                      rows={2}
                      value={gameAccountNotes}
                      onChange={(e) => setGameAccountNotes(e.target.value)}
                      placeholder="أي معلومات إضافية تخص الحساب أو طريقة الدخول..."
                      className="w-full p-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">اسم المنتج / السيارة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: BMW M8 Competition 1695HP Police"
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الوصف التفصيلي *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف تفصيلي للسيارة أو الخدمة ومميزاتها..."
                  className="w-full p-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  القسم المراد وضع المنتج به *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-orange-500/30 rounded-xl text-xs text-white text-right focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">السعر قبل الخصم</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : "")}
                    placeholder="اختياري"
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              {/* MULTI-IMAGE MANAGEMENT SECTION */}
              <div className="p-4 rounded-xl bg-[#12161f] border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    <span>إدارة صور المنتج (الصورة الرئيسية والمعرض الإضافي)</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {imagesList.length} صور مضافة
                  </span>
                </div>

                {/* Images List Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {imagesList.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-xl overflow-hidden border p-1 group bg-black/40 ${
                        idx === 0 ? "border-orange-500 shadow-[0_0_10px_rgba(255,102,0,0.2)]" : "border-gray-700"
                      }`}
                    >
                      <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      
                      {/* Primary Badge */}
                      {idx === 0 && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-orange-500 text-black text-[9px] font-black shadow">
                          الرئيسية ⭐
                        </span>
                      )}

                      {/* Image Action Buttons */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 p-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="px-2 py-1 rounded bg-orange-500 text-black text-[10px] font-bold hover:scale-105 transition"
                          >
                            تعيين كرئيسية
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition"
                        >
                          حذف الصورة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Image Inputs */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="multi-product-image-file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error("حجم الصورة كبير، يفضل اختيار صورة أقل من 2 ميجابايت.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                              setImagesList([...imagesList, result]);
                              toast.success("تمت إضافة الصورة إلى المعرض.");
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="multi-product-image-file"
                      className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة من جهازك</span>
                    </label>

                    <div className="flex-1 flex gap-1">
                      <input
                        type="text"
                        placeholder="أو ضع رابط صورة واضغط إضافة..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold shrink-0"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STOCK & EDITION TYPE SELECTOR */}
              <div className="p-4 rounded-xl bg-[#12161f] border border-gray-800 space-y-3">
                <label className="block text-xs font-bold text-white">
                  نوع الإصدار وكمية المخزون (Edition & Stock) *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStockType("UNLIMITED");
                      setStockQuantity(999);
                      setIsLimited(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      stockType === "UNLIMITED"
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>غير محدود ♾️</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">متوفر دائماً</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStockType("ONE_OF_ONE");
                      setStockQuantity(1);
                      setIsLimited(true);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      stockType === "ONE_OF_ONE"
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      <span dir="ltr" className="inline-block font-mono font-bold">1 of 1</span>
                      <span>🔥</span>
                    </span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">نسخة فريدة وحيدة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStockType("LIMITED");
                      if (stockQuantity === 999 || stockQuantity === 1) setStockQuantity(5);
                      setIsLimited(true);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      stockType === "LIMITED"
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>إصدار محدود 💎</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">عدد قطع محدد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStockType("QUANTITY");
                      if (stockQuantity === 999) setStockQuantity(10);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      stockType === "QUANTITY"
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>كمية مخزون 📦</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">تحديد عدد القطع</span>
                  </button>
                </div>

                {/* Specific Quantity Input when LIMITED or QUANTITY or ONE_OF_ONE */}
                {stockType !== "UNLIMITED" && (
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-4">
                    <label className="text-xs text-gray-300 font-bold">
                      {stockType === "ONE_OF_ONE"
                        ? "الكمية المتاحة (نسخة واحدة فقط):"
                        : "عدد القطع المتاحة في المخزون:"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      disabled={stockType === "ONE_OF_ONE"}
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-center font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#12161f] border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded accent-orange-500"
                  />
                  <span className="text-xs text-gray-300">منتج مميز 🔥</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#12161f] border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded accent-orange-500"
                  />
                  <span className="text-xs text-gray-300">الأكثر مبيعاً ⭐</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#12161f] border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLimited || stockType === "ONE_OF_ONE" || stockType === "LIMITED"}
                    onChange={(e) => setIsLimited(e.target.checked)}
                    className="rounded accent-orange-500"
                  />
                  <span className="text-xs text-gray-300">شارة إصدار محدود 💎</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-extrabold text-xs transition disabled:opacity-50 hover:bg-orange-600"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ المنتج والصور"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold hover:text-white"
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

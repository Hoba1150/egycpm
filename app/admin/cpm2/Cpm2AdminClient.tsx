"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { createProduct, updateProduct, deleteProduct, toggleProductActive, createCategory, updateCategory, deleteCategory, getAdminProductDetails } from "@/lib/actions/product";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Trash2, Gamepad2, X, Upload, Loader2,
  Search, FolderTree, Eye, EyeOff, Tag, CheckCircle2, Flame, Key,
} from "lucide-react";

export default function Cpm2AdminClient({
  initialProducts,
  allCategories,
  cpm2Categories: initialCpm2Cats,
}: {
  initialProducts: any[];
  allCategories: any[];
  cpm2Categories: any[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState(initialProducts);
  const [cpm2Cats, setCpm2Cats] = useState(initialCpm2Cats);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<any | null>(null);

  // Product Type Selector: "REGULAR" vs "GAME_ACCOUNT"
  const [productTypeKind, setProductTypeKind] = useState<"REGULAR" | "GAME_ACCOUNT">("REGULAR");
  const [gameAccountEmail, setGameAccountEmail] = useState("");
  const [gameAccountPassword, setGameAccountPassword] = useState("");
  const [gameAccountNotes, setGameAccountNotes] = useState("");

  // Product form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">(100);
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState(cpm2Cats[0]?.id || allCategories[0]?.id || "");
  const [stockType, setStockType] = useState("UNLIMITED");
  const [stockQuantity, setStockQuantity] = useState<number | "">(999);
  const [imagesList, setImagesList] = useState<string[]>(["https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800"]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Category form fields
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catImage, setCatImage] = useState("https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800");
  const [catSlug, setCatSlug] = useState("");

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductTypeKind("REGULAR");
    setGameAccountEmail("");
    setGameAccountPassword("");
    setGameAccountNotes("");
    setName(""); setDescription(""); setPrice(100); setOriginalPrice("");
    setCategoryId(cpm2Cats[0]?.id || allCategories[0]?.id || "");
    setStockType("UNLIMITED"); setStockQuantity(999);
    setImagesList(["https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800"]);
    setNewImageUrl(""); setIsFeatured(false);
    setIsModalOpen(true);
  };

  const openEditProductModal = async (p: any) => {
    setEditingProductId(p.id);
    const isGameAcc = p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted);
    setProductTypeKind(isGameAcc ? "GAME_ACCOUNT" : "REGULAR");
    setGameAccountEmail("");
    setGameAccountPassword("");
    setGameAccountNotes("");

    setName(p.name); setDescription(p.description); setPrice(p.price);
    setOriginalPrice(p.originalPrice || ""); setCategoryId(p.categoryId);
    setStockType(p.stockType || "UNLIMITED"); setStockQuantity(p.stockQuantity || 999);
    let imgs: string[] = [];
    try { imgs = JSON.parse(p.images); if (!Array.isArray(imgs)) imgs = [p.images]; } catch { imgs = [p.images || ""]; }
    setImagesList(imgs.length > 0 ? imgs : ["https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800"]);
    setNewImageUrl(""); setIsFeatured(p.isFeatured);
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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("يرجى إدخال اسم المنتج."); return; }

    const isGameAcc = productTypeKind === "GAME_ACCOUNT";
    if (isGameAcc && !editingProductId) {
      if (!gameAccountEmail.trim() && !gameAccountPassword.trim()) {
        toast.error("يرجى إدخال بيانات حساب اللعبة (البريد الإلكتروني أو كلمة المرور).");
        return;
      }
    }

    setIsSaving(true);
    try {
      const finalProductType = isGameAcc ? "GAME_ACCOUNT" : "CPM2";
      const finalStockType = isGameAcc ? "ONE_OF_ONE" : stockType;
      const finalStockQty = isGameAcc ? 1 : Number(stockQuantity || 999);
      const gameAccountData = isGameAcc
        ? {
            email: gameAccountEmail.trim(),
            password: gameAccountPassword,
            notes: gameAccountNotes.trim(),
          }
        : undefined;

      const payload = {
        name, description, price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        discountPercent: 0, categoryId, productType: finalProductType as any,
        stockType: finalStockType as any, stockQuantity: finalStockQty,
        images: imagesList, isFeatured, isBestSeller: false, isLimited: isGameAcc ? true : stockType !== "UNLIMITED",
        deliveryTimeMinutes: isGameAcc ? 0 : 10,
        gameAccountData,
      };
      if (editingProductId) {
        const res = await updateProduct(editingProductId, payload);
        if (res?.product) {
          const cat = allCategories.find((c) => c.id === categoryId);
          setProducts((prev) => prev.map((p) => p.id === editingProductId ? { ...p, ...res.product, category: cat } : p));
        }
        toast.success("تم تحديث منتج CPM 2 بنجاح!");
      } else {
        const res = await createProduct(payload);
        if (res?.product) {
          const cat = allCategories.find((c) => c.id === categoryId);
          setProducts((prev) => [{ ...res.product, category: cat }, ...prev]);
        }
        toast.success("تم إضافة منتج CPM 2 بنجاح!");
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ المنتج.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("تم حذف المنتج نهائياً.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف المنتج.");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await toggleProductActive(id);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p));
    } catch (err: any) {
      toast.error(err.message || "فشل تغيير حالة المنتج.");
    }
  };

  // Category handlers
  const openAddCatModal = () => {
    setEditingCat(null); setCatName(""); setCatDesc(""); setCatSlug("");
    setCatImage("https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800");
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat: any) => {
    setEditingCat(cat); setCatName(cat.name); setCatDesc(cat.description || "");
    setCatImage(cat.image || ""); setCatSlug(cat.slug);
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { toast.error("يرجى إدخال اسم القسم."); return; }
    setIsSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catName, description: catDesc, image: catImage, order: editingCat.order || 0 });
        setCpm2Cats((prev) => prev.map((c) => c.id === editingCat.id ? { ...c, name: catName, description: catDesc, image: catImage } : c));
        toast.success("تم تحديث القسم بنجاح!");
      } else {
        // New category: auto-prefix slug with cpm2-
        const res = await createCategory({ name: catName, description: catDesc, image: catImage, order: cpm2Cats.length + 100, isCpm2: true });
        if (res?.category) setCpm2Cats((prev) => [...prev, res.category]);
        toast.success("تم إضافة قسم CPM 2 الجديد!");
      }
      setIsCatModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ القسم.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCat = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف قسم "${name}"؟ سيتم حذف جميع منتجاته.`)) return;
    try {
      await deleteCategory(id);
      setCpm2Cats((prev) => prev.filter((c) => c.id !== id));
      setProducts((prev) => prev.filter((p) => p.categoryId !== id));
      toast.success("تم حذف القسم نهائياً.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف القسم.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${tab === "products" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-400 hover:text-white"}`}>
          <Gamepad2 className="w-3.5 h-3.5 inline ml-1.5" />منتجات CPM 2 ({products.length})
        </button>
        <button onClick={() => setTab("categories")} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${tab === "categories" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-400 hover:text-white"}`}>
          <FolderTree className="w-3.5 h-3.5 inline ml-1.5" />أقسام CPM 2 ({cpm2Cats.length})
        </button>
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في منتجات CPM 2..." className="w-full pr-9 pl-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right" />
            </div>
            <button onClick={openAddProductModal} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition">
              <Plus className="w-3.5 h-3.5" />إضافة منتج CPM 2
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>لا توجد منتجات CPM 2 حتى الآن.</p>
              <p className="text-xs mt-1">أضف منتجاتك الأولى لقسم CPM 2</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                let img = "";
                try { const arr = JSON.parse(p.images); img = Array.isArray(arr) ? arr[0] : p.images; } catch { img = p.images; }
                const isGameAcc = p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted);
                const isSold = isGameAcc && (!p.isActive || p.stockQuantity <= 0);

                return (
                  <div key={p.id} className={`p-4 rounded-2xl bg-[#0f1218] border transition space-y-3 ${isSold ? "border-red-500/50 bg-red-950/10" : p.isActive ? "border-purple-500/30" : "border-gray-800 opacity-60"}`}>
                    <div className="flex gap-3">
                      <div className="relative">
                        <img src={img} alt={p.name} className="w-16 h-16 rounded-lg object-cover border border-gray-800" onError={(e) => { (e.target as any).src = "https://via.placeholder.com/64"; }} />
                        {isSold && (
                          <span className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center text-[10px] font-black text-red-400">
                            مباع ⛔
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                          {isSold ? (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-black shrink-0">
                              تم البيع 🔥
                            </span>
                          ) : isGameAcc ? (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 py-0.5 rounded font-bold shrink-0">
                              🎮 حساب
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{p.category?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-black text-purple-400">{formatCurrency(p.price)}</span>
                          {p.isFeatured && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold">مميز</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditProductModal(p)} className="flex-1 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-gray-300 text-xs font-bold flex items-center justify-center gap-1 transition">
                        <Edit2 className="w-3 h-3" />تعديل
                      </button>
                      <button onClick={() => handleToggleActive(p.id)} className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition ${p.isActive ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                        {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id, p.name)} className="py-1.5 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">أقسام وتصنيفات خاصة بـ CPM 2 فقط</p>
            <button onClick={openAddCatModal} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition">
              <Plus className="w-3.5 h-3.5" />إضافة قسم CPM 2
            </button>
          </div>

          {cpm2Cats.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <FolderTree className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>لا توجد أقسام CPM 2 حتى الآن.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cpm2Cats.map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl bg-[#0f1218] border border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-3">
                    {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover border border-gray-800" onError={(e) => { (e.target as any).src = ""; }} />}
                    <div>
                      <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                      <p className="text-[10px] font-mono text-purple-400">{cat.slug}</p>
                      <p className="text-xs text-gray-400">{cat._count?.products || 0} منتج</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditCatModal(cat)} className="flex-1 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-gray-300 text-xs font-bold flex items-center justify-center gap-1 transition">
                      <Edit2 className="w-3 h-3" />تعديل
                    </button>
                    <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="py-1.5 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-purple-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h2 className="font-black text-white text-base">{editingProductId ? "تعديل منتج CPM 2" : "إضافة منتج CPM 2 جديد"}</h2>
              <Gamepad2 className="w-5 h-5 text-purple-400" />
            </div>
            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              {/* Product Type Selector */}
              <div className="p-3.5 rounded-xl bg-[#12161f] border border-purple-500/20 space-y-2">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-purple-400" />
                  <span>نوع المنتج (Product Type) *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProductTypeKind("REGULAR")}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      productTypeKind === "REGULAR"
                        ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div>
                      <span className="text-xs block">📦 منتج عادي</span>
                      <span className="text-[10px] text-gray-400 font-normal">سيارة، تعديل، كوينز</span>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${productTypeKind === "REGULAR" ? "border-purple-500 bg-purple-500" : "border-gray-600"}`}>
                      {productTypeKind === "REGULAR" && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductTypeKind("GAME_ACCOUNT");
                      setStockType("ONE_OF_ONE");
                      setStockQuantity(1);
                      setIsFeatured(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      productTypeKind === "GAME_ACCOUNT"
                        ? "bg-emerald-500/20 border-emerald-500 text-white font-bold"
                        : "bg-[#161b24] border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div>
                      <span className="text-xs block text-emerald-300">🎮 حساب CPM 2 جاهز</span>
                      <span className="text-[10px] text-gray-400 font-normal">تسليم فوري مشفر للعميل</span>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${productTypeKind === "GAME_ACCOUNT" ? "border-emerald-500 bg-emerald-500" : "border-gray-600"}`}>
                      {productTypeKind === "GAME_ACCOUNT" && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </span>
                  </button>
                </div>
              </div>

              {/* Game Account Credentials Fields */}
              {productTypeKind === "GAME_ACCOUNT" && (
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>بيانات حساب اللعبة (تُشفر ولا تظهر للعميل إلا بعد الدفع)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        البريد الإلكتروني / اسم المستخدم *
                      </label>
                      <input
                        type="text"
                        value={gameAccountEmail}
                        onChange={(e) => setGameAccountEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        كلمة مرور الحساب *
                      </label>
                      <input
                        type="text"
                        value={gameAccountPassword}
                        onChange={(e) => setGameAccountPassword(e.target.value)}
                        placeholder="كلمة المرور..."
                        className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      ملاحظات أو تعليمات إضافية
                    </label>
                    <textarea
                      rows={2}
                      value={gameAccountNotes}
                      onChange={(e) => setGameAccountNotes(e.target.value)}
                      placeholder="تفاصيل إضافية للحساب..."
                      className="w-full p-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">اسم المنتج *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right" placeholder="مثال: CPM 2 Standard Package" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">الوصف</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right resize-none" placeholder="وصف المنتج..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">السعر (جنيه) *</label>
                  <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white" min="0" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">السعر الأصلي</label>
                  <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : "")} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white" min="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">القسم</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right">
                  {cpm2Cats.length === 0 && <option value="">يرجى إنشاء قسم CPM 2 أولاً</option>}
                  {cpm2Cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">نوع المخزون</label>
                <select value={stockType} onChange={(e) => setStockType(e.target.value)} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right">
                  <option value="UNLIMITED">غير محدود</option>
                  <option value="ONE_OF_ONE">1 of 1 (نسخة واحدة فريدة)</option>
                  <option value="LIMITED">كمية محددة</option>
                </select>
              </div>
              {stockType === "LIMITED" && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">الكمية المتاحة</label>
                  <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white" min="1" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">صور المنتج</label>
                <div className="space-y-2">
                  {imagesList.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={url} alt="" className="w-10 h-10 rounded object-cover border border-gray-700" onError={(e) => { (e.target as any).src = ""; }} />
                      <span className="flex-1 text-xs text-gray-400 font-mono truncate">{url}</span>
                      <button type="button" onClick={() => setImagesList(imagesList.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="flex-1 px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white" placeholder="رابط الصورة..." />
                    <button type="button" onClick={() => { if (newImageUrl.trim()) { setImagesList([...imagesList, newImageUrl.trim()]); setNewImageUrl(""); } }} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-purple-500" />
                <span className="text-xs font-bold text-gray-300">منتج مميز (Featured)</span>
              </label>
              <button type="submit" disabled={isSaving} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black transition disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? "جاري الحفظ..." : (editingProductId ? "حفظ التعديلات" : "إضافة المنتج")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-purple-500/30 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h2 className="font-black text-white text-base">{editingCat ? "تعديل قسم CPM 2" : "إضافة قسم CPM 2 جديد"}</h2>
              <FolderTree className="w-5 h-5 text-purple-400" />
            </div>
            <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">اسم القسم *</label>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right" placeholder="مثال: CPM 2 Packages" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">وصف القسم</label>
                <input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right" placeholder="وصف القسم..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">رابط صورة القسم</label>
                <input value={catImage} onChange={(e) => setCatImage(e.target.value)} className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white dir-ltr" placeholder="https://..." />
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black transition disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? "جاري الحفظ..." : (editingCat ? "حفظ التعديلات" : "إضافة القسم")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

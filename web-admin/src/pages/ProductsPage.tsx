import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/lib/cloudinary";
import { vnd } from "@/lib/format";
import type { Product, Category } from "@/types";
import {
  Coffee,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
  AlertCircle,
  Package,
} from "lucide-react";

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Stock modal
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockQty, setQuickStockQty] = useState<number>(0);

  const fetchAll = async () => {
    try {
      setLoading(true);
      // 1. Categories
      const catSnap = await getDocs(collection(db, "categories"));
      const catList: Category[] = [];
      catSnap.forEach((d) => catList.push({ id: d.id, ...(d.data() as Omit<Category, "id">) }));
      catList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setCategories(catList.filter((c) => c.isActive !== false));

      // 2. Products
      const prodSnap = await getDocs(collection(db, "products"));
      const prodList: Product[] = [];
      prodSnap.forEach((d) => prodList.push({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
      prodList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setProducts(prodList.filter((p) => p.isActive !== false));
    } catch (err) {
      console.error("Lỗi tải món ăn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (selectedCatId !== "ALL" && p.categoryId !== selectedCatId) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      icon: "🥤",
      imageUrl: null,
      priceDineIn: 15000,
      priceTakeAway: 15000,
      stockQuantity: 20,
      unit: "ly",
      unitsPerCase: null,
      trackStock: true,
      lowStockAt: 5,
      sortOrder: products.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImageToCloudinary(file);
      setEditingProduct((prev) => (prev ? { ...prev, imageUrl: uploadedUrl } : prev));
    } catch (err) {
      alert("Lỗi tải ảnh lên Cloudinary: " + (err as Error).message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim()) return;

    try {
      setIsSaving(true);
      const dataToSave = {
        name: editingProduct.name.trim(),
        categoryId: editingProduct.categoryId || (categories[0]?.id ?? ""),
        icon: editingProduct.icon || "🥤",
        imageUrl: editingProduct.imageUrl || null,
        priceDineIn: Math.max(0, Number(editingProduct.priceDineIn) || 0),
        priceTakeAway: Math.max(0, Number(editingProduct.priceTakeAway) || 0),
        stockQuantity: Number(editingProduct.stockQuantity) || 0,
        unit: editingProduct.unit?.trim() || "ly",
        unitsPerCase: editingProduct.unitsPerCase ? Number(editingProduct.unitsPerCase) : null,
        trackStock: editingProduct.trackStock ?? true,
        lowStockAt: Number(editingProduct.lowStockAt) || 5,
        sortOrder: Number(editingProduct.sortOrder) || 1,
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      if (editingProduct.id) {
        await updateDoc(doc(db, "products", editingProduct.id), dataToSave);
      } else {
        const newRef = doc(collection(db, "products"));
        await setDoc(newRef, dataToSave);
      }

      setModalOpen(false);
      setEditingProduct(null);
      await fetchAll();
    } catch (err) {
      alert("Lỗi khi lưu món: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoftDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa món "${name}"? (Dữ liệu đơn hàng cũ vẫn được giữ nguyên)`)) return;
    try {
      await updateDoc(doc(db, "products", id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      await fetchAll();
    } catch (err) {
      alert("Lỗi khi xóa món: " + (err as Error).message);
    }
  };

  const handleUpdateStockQuick = async () => {
    if (!quickStockProduct) return;
    try {
      await updateDoc(doc(db, "products", quickStockProduct.id), {
        stockQuantity: quickStockQty,
        updatedAt: serverTimestamp(),
      });
      setQuickStockProduct(null);
      await fetchAll();
    } catch (err) {
      alert("Lỗi cập nhật tồn kho: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Món Ăn & Giá Bán</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Quản lý thực đơn 2 mức giá (Tại quán / Mang về), ảnh Cloudinary và tồn kho
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCatId("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
            selectedCatId === "ALL"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Tất cả ({products.length})
        </button>
        {categories.map((c) => {
          const count = products.filter((p) => p.categoryId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1.5 transition-colors ${
                selectedCatId === c.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{c.icon || "☕"}</span>
              <span>{c.name}</span>
              <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Đang tải danh sách món ăn...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <Coffee className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">Chưa có món ăn nào</h3>
          <p className="text-xs text-slate-400 mt-0.5">Bấm nút "Thêm món mới" để bắt đầu thiết lập thực đơn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const isLowStock = p.trackStock && p.stockQuantity <= p.lowStockAt;
            const categoryName = categories.find((c) => c.id === p.categoryId)?.name || "Đồ uống";

            return (
              <div
                key={p.id}
                className="rounded-3xl bg-white p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Image / Icon & Info */}
                  <div className="flex items-start space-x-3.5">
                    {p.imageUrl ? (
                      <img
                        src={getOptimizedImageUrl(p.imageUrl) || p.imageUrl}
                        alt={p.name}
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                        {p.icon || "🥤"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block truncate">
                        {categoryName}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 truncate" title={p.name}>
                        {p.name}
                      </h3>

                      {/* 2 Giá: Tại quán vs Mang về */}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-extrabold border border-blue-200/50">
                          🏠 {vnd(p.priceDineIn)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 font-extrabold border border-orange-200/50">
                          🛵 {vnd(p.priceTakeAway)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Unit Info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {p.trackStock ? (
                      <button
                        onClick={() => {
                          setQuickStockProduct(p);
                          setQuickStockQty(p.stockQuantity);
                        }}
                        className={`flex items-center space-x-1 font-bold px-2 py-1 rounded-lg transition-colors ${
                          isLowStock
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        title="Bấm để cập nhật nhanh tồn kho"
                      >
                        {isLowStock && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                        <span>
                          Kho: {p.stockQuantity} {p.unit}
                        </span>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium italic">Không quản lý kho</span>
                    )}

                    {p.unitsPerCase && p.unitsPerCase > 1 && (
                      <span className="text-slate-400 font-semibold text-[11px]">
                        1 thùng = {p.unitsPerCase} {p.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="mt-3 pt-2 flex items-center justify-end space-x-1 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Chỉnh sửa món"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSoftDelete(p.id, p.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Xóa món"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa Món Ăn */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingProduct.id ? "Chỉnh Sửa Món Ăn" : "Thêm Món Ăn Mới"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Tên món */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên món đồ uống (ví dụ: CÀ PHÊ SỮA ĐÁ) *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Nhập tên món..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Danh mục & Emoji */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục *</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={editingProduct.icon || "🥤"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, icon: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 text-center text-lg"
                  />
                </div>
              </div>

              {/* Upload Ảnh Cloudinary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ảnh sản phẩm (Cloudinary tự động cắt vuông 300x300)
                </label>
                <div className="flex items-center space-x-3">
                  {editingProduct.imageUrl ? (
                    <img
                      src={editingProduct.imageUrl}
                      alt="Xem trước"
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Coffee className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingImage ? "Đang upload Cloudinary..." : "Tải ảnh từ máy"}</span>
                    </button>
                    {editingProduct.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, imageUrl: null })}
                        className="text-xs text-rose-500 font-bold ml-2 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2 MỨC GIÁ: Tại quán vs Mang về */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-extrabold text-blue-700 mb-1">
                    🏠 Giá Uống Tại Quán (VND) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    value={editingProduct.priceDineIn || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, priceDineIn: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-black text-blue-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-orange-700 mb-1">
                    🛵 Giá Mang Về (VND) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    value={editingProduct.priceTakeAway || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, priceTakeAway: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm font-black text-orange-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Quản lý tồn kho & Đơn vị tính */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Quản lý tồn kho</span>
                    <span className="text-[11px] text-slate-400">Trừ tồn kho khi máy POS bán món này</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingProduct.trackStock ?? true}
                    onChange={(e) => setEditingProduct({ ...editingProduct, trackStock: e.target.checked })}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                </div>

                {editingProduct.trackStock && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tồn kho hiện tại</label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.stockQuantity || 0}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, stockQuantity: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Đơn vị bán lẻ</label>
                      <input
                        type="text"
                        value={editingProduct.unit || "ly"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                        placeholder="ly, lon..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">1 Thùng = ? đơn vị</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="ví dụ 24"
                        value={editingProduct.unitsPerCase || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            unitsPerCase: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Đang lưu..." : "Lưu món ăn"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập Nhật Nhanh Tồn Kho */}
      {quickStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 text-indigo-600">
              <Package className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-base text-slate-900">Cập Nhật Tồn Kho</h3>
            </div>

            <p className="text-xs text-slate-500">
              Sản phẩm: <span className="font-bold text-slate-900">{quickStockProduct.name}</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Số lượng tồn kho mới ({quickStockProduct.unit})
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuickStockQty((q) => Math.max(0, q - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-black text-lg hover:bg-slate-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={quickStockQty}
                  onChange={(e) => setQuickStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl text-slate-900 focus:outline-none"
                />
                <button
                  onClick={() => setQuickStockQty((q) => q + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-black text-lg hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickStockProduct(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpdateStockQuick}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/30 transition-colors"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;

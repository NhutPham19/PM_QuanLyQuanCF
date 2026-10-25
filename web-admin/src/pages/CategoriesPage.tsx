import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Category, ExpenseCategory } from "@/types";
import {
  FolderTree,
  Coins,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

export const CategoriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "EXPENSES">("PRODUCTS");

  // State categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id?: string; name: string; icon: string; orderIndex: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tải danh mục
  const fetchAll = async () => {
    try {
      setLoading(true);
      // 1. Categories
      const catSnap = await getDocs(collection(db, "categories"));
      const catList: Category[] = [];
      catSnap.forEach((d) => catList.push({ id: d.id, ...(d.data() as Omit<Category, "id">) }));
      catList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setCategories(catList.filter((c) => c.isActive !== false));

      // 2. Expense Categories
      const expSnap = await getDocs(collection(db, "expense_categories"));
      const expList: ExpenseCategory[] = [];
      expSnap.forEach((d) => expList.push({ id: d.id, ...(d.data() as Omit<ExpenseCategory, "id">) }));
      expList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setExpenseCategories(expList.filter((e) => e.isActive !== false));
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem({
      name: "",
      icon: activeTab === "PRODUCTS" ? "☕" : "📦",
      orderIndex: activeTab === "PRODUCTS" ? categories.length + 1 : expenseCategories.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Category | ExpenseCategory) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      icon: (item as Category).icon || "📦",
      orderIndex: item.orderIndex || 1,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      setIsSaving(true);
      const collectionName = activeTab === "PRODUCTS" ? "categories" : "expense_categories";

      if (editingItem.id) {
        // Cập nhật
        const ref = doc(db, collectionName, editingItem.id);
        await updateDoc(ref, {
          name: editingItem.name.trim(),
          icon: editingItem.icon || (activeTab === "PRODUCTS" ? "☕" : "📦"),
          orderIndex: Number(editingItem.orderIndex) || 1,
        });
      } else {
        // Tạo mới
        const ref = doc(collection(db, collectionName));
        await setDoc(ref, {
          name: editingItem.name.trim(),
          icon: editingItem.icon || (activeTab === "PRODUCTS" ? "☕" : "📦"),
          orderIndex: Number(editingItem.orderIndex) || 1,
          isActive: true,
        });
      }

      setModalOpen(false);
      setEditingItem(null);
      await fetchAll();
    } catch (err) {
      alert("Lỗi khi lưu danh mục: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này? (Các món liên quan vẫn được lưu trữ an toàn)")) return;
    try {
      const collectionName = activeTab === "PRODUCTS" ? "categories" : "expense_categories";
      await updateDoc(doc(db, collectionName, id), { isActive: false });
      await fetchAll();
    } catch (err) {
      alert("Lỗi khi xóa: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Mục & Phân Loại</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Quản lý các nhóm đồ uống bán lẻ và danh mục nút chi tiền nhanh tại quán
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("PRODUCTS")}
          className={`flex items-center space-x-2 py-3 px-5 font-bold text-sm border-b-2 transition-colors ${
            activeTab === "PRODUCTS"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Danh Mục Đồ Uống ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("EXPENSES")}
          className={`flex items-center space-x-2 py-3 px-5 font-bold text-sm border-b-2 transition-colors ${
            activeTab === "EXPENSES"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Loại Chi Phí Quán ({expenseCategories.length})</span>
        </button>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Đang tải danh mục...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === "PRODUCTS"
            ? categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl shadow-inner">
                      {cat.icon || "☕"}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{cat.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">Thứ tự hiển thị: #{cat.orderIndex}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Sửa danh mục"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSoftDelete(cat.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            : expenseCategories.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner">
                      📦
                    </span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{exp.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">Thứ tự hiển thị: #{exp.orderIndex}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Sửa loại chi"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSoftDelete(exp.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa loại chi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* Modal Thêm / Sửa Danh mục */}
      {modalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingItem.id ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên danh mục (ví dụ: NƯỚC TỰ PHA, MUA ĐÁ LẠNH)
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {activeTab === "PRODUCTS" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Biểu tượng Emoji (ví dụ: ☕, 🥫, 🎋, 🚬)
                  </label>
                  <input
                    type="text"
                    value={editingItem.icon}
                    onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thứ tự hiển thị (1, 2, 3...)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingItem.orderIndex}
                  onChange={(e) => setEditingItem({ ...editingItem, orderIndex: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

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
                  <span>{isSaving ? "Đang lưu..." : "Lưu danh mục"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;

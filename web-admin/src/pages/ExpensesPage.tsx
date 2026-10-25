import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dateKey, monthKey, vnd, formatTimeVn } from "@/lib/format";
import type { Expense, Product, ExpenseCategory } from "@/types";
import {
  Coins,
  Plus,
  Package,
  Calendar,
  Check,
  X,
  Store,
} from "lucide-react";

export const ExpensesPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKey());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<"RESTOCK" | "SUPPLIES">("RESTOCK");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Mua Đá Lạnh");
  const [inputQty, setInputQty] = useState<number>(1);
  const [isCase, setIsCase] = useState<boolean>(true);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // 1. Tải phiếu chi theo tháng
      const q = query(
        collection(db, "expenses"),
        where("monthString", "==", selectedMonth)
      );
      const snap = await getDocs(q);
      const list: Expense[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Expense, "id">) }));
      // Sort theo thời gian giảm dần
      list.sort((a, b) => {
        const timeA = typeof a.createdAt === "object" && a.createdAt && "seconds" in a.createdAt ? a.createdAt.seconds : 0;
        const timeB = typeof b.createdAt === "object" && b.createdAt && "seconds" in b.createdAt ? b.createdAt.seconds : 0;
        return timeB - timeA;
      });
      setExpenses(list);

      // 2. Tải products cho chọn nhập hàng
      const prodSnap = await getDocs(collection(db, "products"));
      const pList: Product[] = [];
      prodSnap.forEach((d) => pList.push({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
      const activeRestockable = pList.filter((p) => p.isActive !== false && p.trackStock);
      setProducts(activeRestockable);
      if (activeRestockable.length > 0 && !selectedProductId) {
        setSelectedProductId(activeRestockable[0].id);
      }

      // 3. Tải expense categories
      const expCatSnap = await getDocs(collection(db, "expense_categories"));
      const expCatList: ExpenseCategory[] = [];
      expCatSnap.forEach((d) => expCatList.push({ id: d.id, ...(d.data() as Omit<ExpenseCategory, "id">) }));
      setExpenseCategories(expCatList.filter((c) => c.isActive !== false));
    } catch (err) {
      console.error("Lỗi tải chi phí:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  // Thống kê tổng chi trong tháng
  const totalExpenseMonth = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const restockExpense = expenses.filter((e) => e.expenseType === "RESTOCK").reduce((sum, e) => sum + (e.amount || 0), 0);
  const suppliesExpense = expenses.filter((e) => e.expenseType !== "RESTOCK").reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert("Vui lòng nhập số tiền chi lớn hơn 0!");
      return;
    }

    try {
      setIsSaving(true);
      const batch = writeBatch(db);
      const newRef = doc(collection(db, "expenses"));
      const today = dateKey();
      const currentMonth = today.substring(0, 7);

      if (expenseType === "RESTOCK") {
        const prod = products.find((p) => p.id === selectedProductId);
        const unitsPerCase = prod?.unitsPerCase || 1;
        const totalUnits = isCase && unitsPerCase > 1 ? inputQty * unitsPerCase : inputQty;
        const autoNote = isCase && unitsPerCase > 1
          ? `Nhập ${inputQty} thùng (${totalUnits} ${prod?.unit || "lon"})`
          : `Nhập ${inputQty} ${prod?.unit || "lon"}`;

        // 1. Tạo phiếu chi
        batch.set(newRef, {
          expenseType: "RESTOCK",
          categoryName: "Nhập hàng bán",
          productId: selectedProductId,
          productName: prod?.name || "Hàng hóa",
          quantity: totalUnits,
          amount: amount,
          note: note ? `${autoNote} - ${note}` : autoNote,
          status: "ACTIVE",
          dateString: today,
          monthString: currentMonth,
          createdAt: serverTimestamp(),
          createdBy: "ADMIN",
        });

        // 2. Cộng tồn kho
        if (selectedProductId) {
          batch.update(doc(db, "products", selectedProductId), {
            stockQuantity: increment(totalUnits),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // Chi đồ dùng quán
        batch.set(newRef, {
          expenseType: "SUPPLIES",
          categoryName: selectedCategoryName || "Đồ dùng quán",
          amount: amount,
          note: note || "",
          status: "ACTIVE",
          dateString: today,
          monthString: currentMonth,
          createdAt: serverTimestamp(),
          createdBy: "ADMIN",
        });
      }

      // 3. Cập nhật totalExpense trong daily_summaries ngày hôm nay
      const summaryRef = doc(db, "daily_summaries", today);
      batch.set(
        summaryRef,
        {
          totalExpense: increment(amount),
          dateString: today,
          monthString: currentMonth,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      setModalOpen(false);
      setAmount(0);
      setNote("");
      await fetchExpenses();
    } catch (err) {
      alert("Lỗi khi ghi nhận phiếu chi: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sổ Tiền & Chi Phí</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Theo dõi chi tiêu nhập hàng hóa (tồn kho) và các chi phí đồ dùng vận hành quán
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-600/30 hover:bg-amber-700 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi phiếu chi</span>
        </button>
      </div>

      {/* Month Selector & Filter */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">Chọn tháng:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs md:text-sm font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
          />
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 font-semibold block">Tổng chi tháng</span>
          <span className="text-lg md:text-xl font-black text-amber-600">{vnd(totalExpenseMonth)}</span>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tiền Nhập Hàng</span>
            <span className="text-base md:text-lg font-black text-slate-900">{vnd(restockExpense)}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Đồ Dùng Quán</span>
            <span className="text-base md:text-lg font-black text-slate-900">{vnd(suppliesExpense)}</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Đang tải phiếu chi...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">Chưa có phiếu chi nào</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tháng {selectedMonth} chưa ghi nhận khoản chi tiền nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="rounded-3xl bg-white p-4 md:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                    exp.expenseType === "RESTOCK"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {exp.expenseType === "RESTOCK" ? <Package className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm md:text-base text-slate-900">
                      {exp.categoryName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {exp.dateString} ({formatTimeVn(exp.createdAt as string)})
                    </span>
                  </div>
                  {exp.note && <p className="text-xs text-slate-500 mt-0.5 font-medium">{exp.note}</p>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base md:text-lg font-black text-amber-600">
                  - {vnd(exp.amount)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Bởi: {exp.createdBy || "POS"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ghi Phiếu Chi */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Ghi Phiếu Chi Tiền</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setExpenseType("RESTOCK")}
                className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                  expenseType === "RESTOCK" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600"
                }`}
              >
                📦 Nhập Hàng Bán (Cộng Kho)
              </button>
              <button
                type="button"
                onClick={() => setExpenseType("SUPPLIES")}
                className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                  expenseType === "SUPPLIES" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                }`}
              >
                🛒 Mua Đồ Dùng Quán
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              {expenseType === "RESTOCK" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chọn sản phẩm nhập *</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon} {p.name} (Tồn hiện tại: {p.stockQuantity} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng nhập *</label>
                      <input
                        type="number"
                        min="1"
                        value={inputQty}
                        onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị nhập</label>
                      <select
                        value={isCase ? "CASE" : "UNIT"}
                        onChange={(e) => setIsCase(e.target.value === "CASE")}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                      >
                        <option value="CASE">Thùng</option>
                        <option value="UNIT">Lon / Chai lẻ</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khoản mục chi *</label>
                  <select
                    value={selectedCategoryName}
                    onChange={(e) => setSelectedCategoryName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Chi phí khác">Chi phí khác...</option>
                  </select>
                </div>
              )}

              {/* Số tiền chi */}
              <div>
                <label className="block text-xs font-bold text-amber-700 mb-1">Số tiền chi (VND) *</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  required
                  value={amount || ""}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  placeholder="Ví dụ: 120000"
                  className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-lg font-black text-amber-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm (Tùy chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Nhập 2 bao đá, mua đá viên..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Submit */}
              <div className="flex space-x-3 pt-2">
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
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Đang ghi..." : "Lưu phiếu chi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;

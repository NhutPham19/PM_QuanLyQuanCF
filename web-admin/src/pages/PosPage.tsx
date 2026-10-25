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
import { dateKey, vnd, monthKey } from "@/lib/format";
import type { Product, Category } from "@/types";
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  ArrowLeft,
  X,
  CreditCard,
  UtensilsCrossed,
  Bike,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("ALL");
  const [isDineIn, setIsDineIn] = useState<boolean>(true);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [lastOrderTotal, setLastOrderTotal] = useState<number>(0);
  const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);

  // Nạp danh mục & món ăn
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Danh mục
        const catSnap = await getDocs(
          query(collection(db, "categories"), where("isActive", "==", true))
        );
        const cats: Category[] = [];
        catSnap.forEach((d) => cats.push({ id: d.id, ...d.data() } as Category));
        cats.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setCategories(cats);

        // Món ăn
        const prodSnap = await getDocs(
          query(collection(db, "products"), where("isActive", "==", true))
        );
        const prods: Product[] = [];
        prodSnap.forEach((d) => prods.push({ id: d.id, ...d.data() } as Product));
        prods.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setProducts(prods);
      } catch (err) {
        console.error("Lỗi nạp dữ liệu POS:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Thêm vào giỏ hàng
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      if (existing) {
        next.set(product.id, { product, quantity: existing.quantity + 1 });
      } else {
        next.set(product.id, { product, quantity: 1 });
      }
      return next;
    });

    // Phát âm thanh beep ngắn bằng Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Bỏ qua nếu browser chặn audio tự động
    }
  };

  // Giảm số lượng
  const decreaseQty = (productId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        next.delete(productId);
      } else {
        next.set(productId, { ...existing, quantity: existing.quantity - 1 });
      }
      return next;
    });
  };

  // Xóa toàn bộ giỏ
  const clearCart = () => {
    setCart(new Map());
  };

  // Lọc sản phẩm theo danh mục
  const filteredProducts = products.filter((p) => {
    if (selectedCatId === "ALL") return true;
    return p.categoryId === selectedCatId;
  });

  // Tính tổng tiền & số lượng
  const cartItems = Array.from(cart.values());
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = isDineIn
      ? (item.product.priceDineIn ?? item.product.priceTakeAway ?? 0)
      : (item.product.priceTakeAway ?? item.product.priceDineIn ?? 0);
    return sum + price * item.quantity;
  }, 0);

  // Thanh toán và ghi đơn hàng nguyên tử
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      setProcessing(true);
      const today = dateKey();
      const month = monthKey();
      const batch = writeBatch(db);

      // 1. Tạo document đơn hàng mới
      const orderRef = doc(collection(db, "orders"));
      const orderItemsData = cartItems.map((item) => {
        const itemPrice = isDineIn
          ? (item.product.priceDineIn ?? item.product.priceTakeAway ?? 0)
          : (item.product.priceTakeAway ?? item.product.priceDineIn ?? 0);
        return {
          productId: item.product.id,
          name: item.product.name,
          icon: item.product.icon ?? "☕",
          imageUrl: item.product.imageUrl ?? "",
          price: itemPrice,
          quantity: item.quantity,
          subtotal: itemPrice * item.quantity,
          trackStock: item.product.trackStock ?? false,
        };
      });

      batch.set(orderRef, {
        dateString: today,
        monthString: month,
        orderType: isDineIn ? "DINE_IN" : "TAKE_AWAY",
        status: "ACTIVE",
        items: orderItemsData,
        totalAmount: totalAmount,
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? "POS_ADMIN",
        creatorEmail: user?.email ?? "pos@gmail.com",
      });

      // 2. Trừ tồn kho nếu có quản lý kho
      cartItems.forEach((item) => {
        if (item.product.trackStock) {
          const prodRef = doc(db, "products", item.product.id);
          batch.update(prodRef, {
            stockQuantity: increment(-item.quantity),
            updatedAt: serverTimestamp(),
          });
        }
      });

      // 3. Cập nhật daily_summaries nguyên tử
      const summaryRef = doc(db, "daily_summaries", today);
      batch.set(
        summaryRef,
        {
          dateString: today,
          monthString: month,
          totalRevenue: increment(totalAmount),
          totalOrders: increment(1),
          ...(isDineIn
            ? { dineInRevenue: increment(totalAmount) }
            : { takeawayRevenue: increment(totalAmount) }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      setLastOrderTotal(totalAmount);
      clearCart();
      setMobileCartOpen(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Lỗi tạo đơn hàng:", err);
      alert("Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại!");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 lg:pb-0">
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP BAR) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Về Quản Trị</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Máy Bán Hàng (POS)
                </h1>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                Cà Phê Gia Đình • Chạm để chọn món
              </p>
            </div>
          </div>

          {/* CHUYỂN ĐỔI CHẾ ĐỘ TẠI QUÁN / MANG VỀ */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setIsDineIn(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                isDineIn
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Tại Quán</span>
            </button>
            <button
              onClick={() => setIsDineIn(false)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                !isDineIn
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Mang Về</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. KHU VỰC CHÍNH (SPLIT VIEW) */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex gap-6 p-4">
        {/* CỘT TRÁI: DANH MỤC & LƯỚI SẢN PHẨM (HÌNH ẢNH TO RÕ) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* THANH DANH MỤC DẠNG PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCatId("ALL")}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCatId === "ALL"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              ☕ Tất Cả ({products.length})
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatId(c.id)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCatId === c.id
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.icon ?? "🏷️"} {c.name} ({count})
                </button>
              );
            })}
          </div>

          {/* LƯỚI SẢN PHẨM: ẢNH TO HƠN, RÕ NÉT, DỄ NHÌN */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center">
              <Coffee className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Chưa có món trong danh mục này</p>
              <p className="text-xs text-slate-400 mt-1">Vui lòng chọn danh mục khác hoặc thêm món mới</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 pb-8">
              {filteredProducts.map((product) => {
                const currentPrice = isDineIn
                  ? (product.priceDineIn ?? product.priceTakeAway ?? 0)
                  : (product.priceTakeAway ?? product.priceDineIn ?? 0);
                const cartQty = cart.get(product.id)?.quantity ?? 0;
                const isSelected = cartQty > 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`relative bg-white rounded-3xl overflow-hidden border cursor-pointer select-none transition-all duration-200 hover:shadow-lg active:scale-[0.97] flex flex-col ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    {/* BADGE SỐ LƯỢNG KHI ĐÃ CHỌN */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-600/40 animate-in zoom-in-75">
                        {cartQty}
                      </div>
                    )}

                    {/* HÌNH ẢNH MÓN HÀNG TO HƠN, RÕ NÉT */}
                    <div className="relative w-full h-36 sm:h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-indigo-50 text-slate-400">
                          <span className="text-5xl sm:text-6xl drop-shadow-sm select-none">
                            {product.icon || "☕"}
                          </span>
                        </div>
                      )}

                      {/* NHÃN HÌNH THỨC GIÁ */}
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase tracking-wider">
                        {isDineIn ? "Tại quán" : "Mang về"}
                      </div>
                    </div>

                    {/* THÔNG TIN MÓN ĂN: TÊN TO, GIÁ RÕ RÀNG */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 uppercase">
                          {product.name}
                        </h3>
                        {product.trackStock && (
                          <p
                            className={`text-[11px] font-bold mt-1 ${
                              product.stockQuantity <= (product.lowStockAt ?? 5)
                                ? "text-rose-600"
                                : "text-slate-500"
                            }`}
                          >
                            Kho: {product.stockQuantity} {product.unit || "ly"}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-base sm:text-lg font-black text-indigo-600">
                          {vnd(currentPrice)}
                        </span>
                        <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-indigo-600 hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: GIỎ HÀNG (DESKTOP & TABLET VIEW) */}
        <div className="hidden lg:flex flex-col w-96 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-[calc(100vh-6rem)] sticky top-20">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Đơn Hàng Hiện Tại
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {isDineIn ? "🏠 Dùng tại quán" : "🛵 Khách mang về"}
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Xóa giỏ hàng"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* DANH SÁCH MÓN TRONG GIỎ */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Giỏ hàng đang trống</p>
                <p className="text-xs mt-1">Chạm vào món bên trái để bắt đầu tạo đơn</p>
              </div>
            ) : (
              cartItems.map(({ product, quantity }) => {
                const itemPrice = isDineIn
                  ? (product.priceDineIn ?? product.priceTakeAway ?? 0)
                  : (product.priceTakeAway ?? product.priceDineIn ?? 0);
                const subtotal = itemPrice * quantity;

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{product.icon || "☕"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate uppercase">
                        {product.name}
                      </h4>
                      <p className="text-xs font-bold text-indigo-600">
                        {vnd(subtotal)} <span className="text-[10px] text-slate-400 font-normal">({vnd(itemPrice)})</span>
                      </p>
                    </div>

                    {/* ĐIỀU CHỈNH SỐ LƯỢNG */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => decreaseQty(product.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-sm text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TỔNG KẾT & NÚT THANH TOÁN */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Tổng số lượng:</span>
              <span className="text-slate-900 font-extrabold">{totalItemCount} phần</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>Tổng tiền:</span>
              <span className="text-2xl font-black text-indigo-600">{vnd(totalAmount)}</span>
            </div>

            <button
              disabled={cartItems.length === 0 || processing}
              onClick={handleCheckout}
              className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý đơn...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>TẠO ĐƠN & BÁN HÀNG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. THANH GIỎ HÀNG NỔI CHO MOBILE (BOTTOM FLOATING BAR) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => setMobileCartOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer flex-1"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  {totalItemCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">
                {isDineIn ? "Tại quán" : "Mang về"}
              </p>
              <p className="text-base font-black text-slate-900">{vnd(totalAmount)}</p>
            </div>
          </div>

          <button
            disabled={cartItems.length === 0 || processing}
            onClick={handleCheckout}
            className="py-3 px-5 bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            {processing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Thanh Toán ({totalItemCount})</span>
          </button>
        </div>
      </div>

      {/* 4. MODAL CHI TIẾT GIỎ HÀNG MOBILE */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Chi tiết đơn ({totalItemCount} món)
              </h3>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {cartItems.map(({ product, quantity }) => {
                const itemPrice = isDineIn
                  ? (product.priceDineIn ?? product.priceTakeAway ?? 0)
                  : (product.priceTakeAway ?? product.priceDineIn ?? 0);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">{product.name}</h4>
                      <p className="text-xs font-bold text-indigo-600">{vnd(itemPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseQty(product.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-sm">{quantity}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-500">Tổng thanh toán:</span>
                <span className="text-xl font-black text-indigo-600">{vnd(totalAmount)}</span>
              </div>
              <button
                disabled={processing}
                onClick={handleCheckout}
                className="w-full py-3.5 bg-emerald-600 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                Xác Nhận Tạo Đơn Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL BÁO THÀNH CÔNG (SUCCESS TOAST) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Bán Hàng Thành Công!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Đơn hàng đã được lưu và tự động cộng vào Doanh Thu Ngày.
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-500">Số tiền thanh toán</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{vnd(lastOrderTotal)}</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30"
            >
              Tiếp tục bán hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

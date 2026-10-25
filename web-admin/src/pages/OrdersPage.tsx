import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dateKey, vnd, formatTimeVn } from "@/lib/format";
import type { Order, OrderStatus, OrderType } from "@/types";
import {
  Receipt,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Ban,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

export const OrdersPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(dateKey());
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | OrderType>("ALL");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Thao tác hủy / khôi phục đơn
  const [actionOrder, setActionOrder] = useState<{ order: Order; isVoid: boolean } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Tải danh sách đơn hàng theo ngày đã chọn
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "orders"),
        where("dateString", "==", selectedDate),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const list: Order[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<Order, "id">) });
      });
      setOrders(list);
    } catch (error) {
      console.warn("Lỗi tải đơn hàng:", error);
      // Fallback query không orderBy nếu chưa có composite index
      try {
        const qFallback = query(
          collection(db, "orders"),
          where("dateString", "==", selectedDate)
        );
        const snapshot = await getDocs(qFallback);
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Order, "id">) });
        });
        setOrders(list);
      } catch (e) {
        console.error("Lỗi fallback đơn hàng:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  // Bộ lọc Client-side cho status và orderType
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && o.orderType !== typeFilter) return false;
    return true;
  });

  // Thống kê nhanh trong ngày
  const activeOrders = orders.filter((o) => o.status === "ACTIVE");
  const voidedOrders = orders.filter((o) => o.status === "VOIDED");
  const totalActiveRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Xử lý HỦY ĐƠN nguyên tử (WriteBatch)
  const handleVoidOrder = async (order: Order) => {
    try {
      setIsSubmittingAction(true);
      const batch = writeBatch(db);

      // 1. Cập nhật trạng thái đơn
      const orderRef = doc(db, "orders", order.id);
      batch.update(orderRef, {
        status: "VOIDED",
        voidedAt: serverTimestamp(),
        voidedBy: "ADMIN",
      });

      // 2. Hoàn lại số lượng tồn kho
      for (const item of order.items) {
        if (item.trackStock && item.productId) {
          const productRef = doc(db, "products", item.productId);
          batch.update(productRef, {
            stockQuantity: increment(item.quantity),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 3. Trừ doanh thu và số đơn trong daily_summaries
      const summaryRef = doc(db, "daily_summaries", order.dateString);
      batch.set(
        summaryRef,
        {
          totalRevenue: increment(-order.totalAmount),
          totalOrders: increment(-1),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      setActionOrder(null);
      await fetchOrders();
    } catch (err) {
      alert("Lỗi khi hủy đơn hàng: " + (err as Error).message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Xử lý KHÔI PHỤC ĐƠN nguyên tử (WriteBatch)
  const handleRestoreOrder = async (order: Order) => {
    try {
      setIsSubmittingAction(true);
      const batch = writeBatch(db);

      // 1. Cập nhật lại trạng thái ACTIVE
      const orderRef = doc(db, "orders", order.id);
      batch.update(orderRef, {
        status: "ACTIVE",
        voidedAt: null,
        voidedBy: null,
      });

      // 2. Trừ lại tồn kho
      for (const item of order.items) {
        if (item.trackStock && item.productId) {
          const productRef = doc(db, "products", item.productId);
          batch.update(productRef, {
            stockQuantity: increment(-item.quantity),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 3. Cộng lại doanh thu trong daily_summaries
      const summaryRef = doc(db, "daily_summaries", order.dateString);
      batch.set(
        summaryRef,
        {
          totalRevenue: increment(order.totalAmount),
          totalOrders: increment(1),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      setActionOrder(null);
      await fetchOrders();
    } catch (err) {
      alert("Lỗi khi khôi phục đơn: " + (err as Error).message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lịch Sử Đơn Hàng</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Tra cứu đơn bán, chi tiết món và thao tác Hủy / Khôi phục đơn hàng nguyên tử
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-sm self-start">
          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs md:text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
          />
          {selectedDate !== dateKey() && (
            <button
              onClick={() => setSelectedDate(dateKey())}
              className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100"
            >
              Hôm nay
            </button>
          )}
        </div>
      </div>

      {/* Daily Snapshot Stat Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Doanh Thu Hợp Lệ
          </span>
          <span className="text-lg md:text-xl font-black text-indigo-600 mt-1 block">
            {vnd(totalActiveRevenue)}
          </span>
        </div>
        <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Đơn Thành Công
          </span>
          <span className="text-lg md:text-xl font-black text-emerald-600 mt-1 block">
            {activeOrders.length} đơn
          </span>
        </div>
        <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Đơn Đã Hủy
          </span>
          <span className="text-lg md:text-xl font-black text-rose-500 mt-1 block">
            {voidedOrders.length} đơn
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Lọc trạng thái:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === "ACTIVE" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Thành công ({activeOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter("VOIDED")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === "VOIDED" ? "bg-rose-500 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Đã hủy ({voidedOrders.length})
            </button>
          </div>
        </div>

        {/* Order Type Filter */}
        <div className="flex space-x-1">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Mọi hình thức
          </button>
          <button
            onClick={() => setTypeFilter("DINE_IN")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === "DINE_IN" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            🏠 Tại quán
          </button>
          <button
            onClick={() => setTypeFilter("TAKE_AWAY")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === "TAKE_AWAY" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            🛵 Mang về
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">Không có đơn hàng nào</h3>
          <p className="text-xs text-slate-400 mt-0.5">Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isVoided = order.status === "VOIDED";
            const itemCount = order.items.reduce((s, i) => s + (i.quantity || 0), 0);

            return (
              <div
                key={order.id}
                className={`rounded-3xl bg-white p-4 md:p-5 border transition-all duration-150 ${
                  isVoided
                    ? "border-rose-200/60 bg-rose-50/15 opacity-80"
                    : "border-slate-200/80 shadow-sm hover:border-indigo-300"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Badges & Time */}
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center space-x-1 ${
                        order.orderType === "DINE_IN"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                          : "bg-orange-50 text-orange-700 border border-orange-200/60"
                      }`}
                    >
                      <span>{order.orderType === "DINE_IN" ? "🏠 Tại quán" : "🛵 Mang về"}</span>
                    </span>

                    {isVoided ? (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200 flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ĐÃ HỦY</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>THÀNH CÔNG</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimeVn(order.createdAt as string)}</span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                      #{order.id.substring(0, 6)}
                    </span>
                  </div>

                  {/* Right: Total Amount & Action buttons */}
                  <div className="flex items-center space-x-3 self-end md:self-auto">
                    <span
                      className={`text-lg md:text-xl font-black ${
                        isVoided ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {vnd(order.totalAmount)}
                    </span>

                    {/* Void / Restore buttons */}
                    {isVoided ? (
                      <button
                        onClick={() => setActionOrder({ order, isVoid: false })}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActionOrder({ order, isVoid: true })}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Hủy đơn</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Xem chi tiết"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Items Summary line */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="truncate max-w-md">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(" • ")}
                  </div>
                  <span className="shrink-0 text-slate-400 font-medium ml-2">
                    {itemCount} món
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xem Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Chi Tiết Đơn Hàng</h3>
                <p className="text-xs font-mono text-slate-400">ID: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold py-1">
              <span className="text-slate-500">Hình thức:</span>
              <span className="font-bold text-slate-900">
                {selectedOrder.orderType === "DINE_IN" ? "🏠 Uống tại quán" : "🛵 Mang về"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold py-1">
              <span className="text-slate-500">Thời gian tạo:</span>
              <span className="font-bold text-slate-900">{formatTimeVn(selectedOrder.createdAt as string)}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold py-1">
              <span className="text-slate-500">Người tạo:</span>
              <span className="font-bold text-slate-900">{selectedOrder.createdBy || "POS"}</span>
            </div>

            {selectedOrder.status === "VOIDED" && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <span className="font-bold block">❌ Đơn hàng này đã bị hủy:</span>
                <span>Hủy bởi: {selectedOrder.voidedBy || "ADMIN"}</span>
              </div>
            )}

            {/* Danh sách món */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs font-extrabold uppercase text-slate-400 block mb-2">
                Danh sách món đã đặt
              </span>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{item.icon || "🥤"}</span>
                      <span className="font-bold text-slate-800">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-xs text-slate-400">(@ {vnd(item.price)})</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{vnd(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-600 text-sm">Tổng cộng:</span>
              <span className="text-2xl font-black text-indigo-600">{vnd(selectedOrder.totalAmount)}</span>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-4 py-3 bg-slate-900 text-white font-bold text-sm rounded-2xl hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Hủy / Khôi phục Đơn */}
      {actionOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-lg text-slate-900">
                {actionOrder.isVoid ? "Xác nhận HỦY đơn hàng?" : "Xác nhận KHÔI PHỤC đơn?"}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {actionOrder.isVoid
                ? `Hệ thống sẽ chuyển trạng thái đơn #${actionOrder.order.id.substring(0, 6)} thành ĐÃ HỦY, tự động hoàn lại tồn kho cho các món và giảm trừ ${vnd(actionOrder.order.totalAmount)} khỏi doanh thu hôm nay.`
                : `Hệ thống sẽ khôi phục đơn #${actionOrder.order.id.substring(0, 6)} về THÀNH CÔNG, trừ lại số lượng tồn kho và cộng lại ${vnd(actionOrder.order.totalAmount)} vào doanh thu ngày.`}
            </p>

            <div className="flex space-x-3 pt-3">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setActionOrder(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
              >
                Không
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() =>
                  actionOrder.isVoid
                    ? handleVoidOrder(actionOrder.order)
                    : handleRestoreOrder(actionOrder.order)
                }
                className={`flex-1 py-3 text-white font-bold text-sm rounded-2xl shadow-lg transition-colors ${
                  actionOrder.isVoid
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
                }`}
              >
                {isSubmittingAction ? "Đang xử lý..." : actionOrder.isVoid ? "Đồng ý Hủy" : "Đồng ý Khôi phục"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

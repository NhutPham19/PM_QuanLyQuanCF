import { collection, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

/**
 * Tự động dọn dẹp đơn hàng và chi phí quá 45 ngày
 * Chỉ chạy tối đa 1 lần/ngày bằng cờ localStorage để tối ưu quota Firestore
 */
export async function purgeOldHistory(
  db: Firestore,
  daysToKeep = 45
): Promise<{ deletedOrders: number; deletedExpenses: number }> {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastCheck = localStorage.getItem("last_retention_check");
    if (lastCheck === todayStr) {
      return { deletedOrders: 0, deletedExpenses: 0 };
    }

    const cutoffMs = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const cutoffTimestamp = Timestamp.fromMillis(cutoffMs);

    let deletedOrders = 0;
    let deletedExpenses = 0;

    // 1. Quét orders cũ hơn 45 ngày
    try {
      const ordersQ = query(
        collection(db, "orders"),
        where("createdAt", "<", cutoffTimestamp)
      );
      const ordersSnap = await getDocs(ordersQ);
      if (!ordersSnap.empty) {
        const batch = writeBatch(db);
        ordersSnap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
          deletedOrders++;
        });
        await batch.commit();
        console.log(`🧹 Đã tự động xóa ${deletedOrders} đơn hàng quá ${daysToKeep} ngày.`);
      }
    } catch (orderErr) {
      console.warn("Bỏ qua dọn dẹp orders:", orderErr);
    }

    // 2. Quét expenses cũ hơn 45 ngày
    try {
      const expQ = query(
        collection(db, "expenses"),
        where("createdAt", "<", cutoffTimestamp)
      );
      const expSnap = await getDocs(expQ);
      if (!expSnap.empty) {
        const batch = writeBatch(db);
        expSnap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
          deletedExpenses++;
        });
        await batch.commit();
        console.log(`🧹 Đã tự động xóa ${deletedExpenses} khoản chi quá ${daysToKeep} ngày.`);
      }
    } catch (expErr) {
      console.warn("Bỏ qua dọn dẹp expenses:", expErr);
    }

    localStorage.setItem("last_retention_check", todayStr);
    return { deletedOrders, deletedExpenses };
  } catch (err) {
    console.warn("Lỗi khi kiểm tra dữ liệu quá hạn:", err);
    return { deletedOrders: 0, deletedExpenses: 0 };
  }
}

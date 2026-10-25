import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { monthKey } from "@/lib/format";
import type { Order, Expense } from "@/types";
import {
  FileSpreadsheet,
  Download,
  Copy,
  Calendar,
  Check,
  Receipt,
  Coins,
} from "lucide-react";

export const ExportPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKey());
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // 1. Tạo chuỗi CSV Đơn Hàng (có BOM UTF-8)
  const generateOrdersCsv = (orders: Order[]): string => {
    const BOM = "\uFEFF";
    const header = "Mã Đơn,Ngày Bán,Loại Đơn,Tổng Tiền (VND),Trạng Thái,Chi Tiết Món\n";
    const rows = orders.map((o) => {
      const itemsStr = o.items.map((i) => `${i.quantity}x ${i.name}`).join("; ");
      const typeStr = o.orderType === "DINE_IN" ? "Tại quán" : "Mang về";
      const statusStr = o.status === "ACTIVE" ? "Thành công" : "Đã hủy";
      return `"${o.id}","${o.dateString}","${typeStr}",${o.totalAmount},"${statusStr}","${itemsStr}"`;
    });
    return BOM + header + rows.join("\n");
  };

  // 2. Tạo chuỗi CSV Phiếu Chi (có BOM UTF-8)
  const generateExpensesCsv = (expenses: Expense[]): string => {
    const BOM = "\uFEFF";
    const header = "Mã Phiếu Chi,Ngày Chi,Loại Chi,Khoản Mục,Số Tiền (VND),Ghi Chú\n";
    const rows = expenses.map((e) => {
      const typeStr = e.expenseType === "RESTOCK" ? "Nhập hàng" : "Đồ dùng quán";
      const cleanNote = (e.note || "").replace(/"/g, '""');
      return `"${e.id}","${e.dateString}","${typeStr}","${e.categoryName}",${e.amount},"${cleanNote}"`;
    });
    return BOM + header + rows.join("\n");
  };

  // Tải file về máy tính / điện thoại
  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Xử lý xuất CSV Đơn hàng
  const handleExportOrders = async (isDownload: boolean) => {
    try {
      setLoadingOrders(true);
      const q = query(
        collection(db, "orders"),
        where("monthString", "==", selectedMonth)
      );
      const snap = await getDocs(q);
      const list: Order[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Order, "id">) }));

      if (list.length === 0) {
        alert(`Không có đơn hàng nào trong tháng ${selectedMonth} để xuất!`);
        return;
      }

      const csv = generateOrdersCsv(list);
      if (isDownload) {
        downloadFile(csv, `DonHang_${selectedMonth}.csv`);
      } else {
        await navigator.clipboard.writeText(csv);
        setCopiedType("ORDERS");
        setTimeout(() => setCopiedType(null), 2500);
      }
    } catch (err) {
      alert("Lỗi xuất đơn hàng: " + (err as Error).message);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Xử lý xuất CSV Phiếu chi
  const handleExportExpenses = async (isDownload: boolean) => {
    try {
      setLoadingExpenses(true);
      const q = query(
        collection(db, "expenses"),
        where("monthString", "==", selectedMonth)
      );
      const snap = await getDocs(q);
      const list: Expense[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Expense, "id">) }));

      if (list.length === 0) {
        alert(`Không có phiếu chi nào trong tháng ${selectedMonth} để xuất!`);
        return;
      }

      const csv = generateExpensesCsv(list);
      if (isDownload) {
        downloadFile(csv, `ChiPhi_${selectedMonth}.csv`);
      } else {
        await navigator.clipboard.writeText(csv);
        setCopiedType("EXPENSES");
        setTimeout(() => setCopiedType(null), 2500);
      }
    } catch (err) {
      alert("Lỗi xuất chi phí: " + (err as Error).message);
    } finally {
      setLoadingExpenses(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Xuất Dữ Liệu CSV / Excel</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Tải báo cáo kế toán tháng mở chuẩn tiếng Việt trên Microsoft Excel (BOM UTF-8)
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-sm self-start">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs md:text-sm font-black text-slate-900 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* 2 Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Đơn Hàng */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Báo Cáo Đơn Hàng Tháng {selectedMonth}</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bao gồm: Mã đơn, Thời gian bán, Hình thức (Tại quán / Mang về), Tổng tiền, Trạng thái (Thành công / Đã hủy), và Chi tiết từng món.
            </p>
          </div>

          <div className="flex space-x-2.5 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleExportOrders(true)}
              disabled={loadingOrders}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{loadingOrders ? "Đang xuất..." : "Tải File CSV"}</span>
            </button>

            <button
              onClick={() => handleExportOrders(false)}
              disabled={loadingOrders}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center justify-center space-x-1 transition-colors"
              title="Sao chép nội dung vào Clipboard"
            >
              {copiedType === "ORDERS" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === "ORDERS" ? "Đã chép!" : "Sao chép"}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Chi Phí */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Coins className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Báo Cáo Phiếu Chi Tháng {selectedMonth}</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bao gồm: Mã phiếu chi, Ngày chi, Phân loại (Nhập hàng bán / Mua đồ dùng quán), Khoản mục, Số tiền chi thực tế, và Ghi chú chi tiết.
            </p>
          </div>

          <div className="flex space-x-2.5 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleExportExpenses(true)}
              disabled={loadingExpenses}
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-amber-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{loadingExpenses ? "Đang xuất..." : "Tải File CSV"}</span>
            </button>

            <button
              onClick={() => handleExportExpenses(false)}
              disabled={loadingExpenses}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center justify-center space-x-1 transition-colors"
              title="Sao chép nội dung vào Clipboard"
            >
              {copiedType === "EXPENSES" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === "EXPENSES" ? "Đã chép!" : "Sao chép"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="rounded-3xl bg-slate-100/70 p-5 text-xs text-slate-500 space-y-1">
        <div className="flex items-center space-x-2 font-bold text-slate-700">
          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          <span>Lưu ý về định dạng file:</span>
        </div>
        <p>• File CSV được tự động nhúng mã Byte Order Mark (BOM UTF-8) giúp mở trực tiếp trên Microsoft Excel tiếng Việt không bao giờ bị lỗi font hay vỡ dấu.</p>
        <p>• Dữ liệu xuất chính xác theo múi giờ Việt Nam (UTC+7) đã lọc theo từng tháng kế toán tương ứng.</p>
      </div>
    </div>
  );
};

export default ExportPage;

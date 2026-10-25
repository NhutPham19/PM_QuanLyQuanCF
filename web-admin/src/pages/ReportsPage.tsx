import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { monthKey, vnd } from "@/lib/format";
import type { DailySummary } from "@/types";
import {
  BarChart3,
  Calendar,
  RotateCw,
  TrendingUp,
  Coins,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

export const ReportsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKey());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculatingDate, setRecalculatingDate] = useState<string | null>(null);

  const fetchMonthlySummaries = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "daily_summaries"),
        where("monthString", "==", selectedMonth)
      );
      const snap = await getDocs(q);
      const list: DailySummary[] = [];
      snap.forEach((d) => list.push({ dateString: d.id, ...(d.data() as Omit<DailySummary, "dateString">) }));
      list.sort((a, b) => b.dateString.localeCompare(a.dateString));
      setSummaries(list);
    } catch (err) {
      console.error("Lỗi tải báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySummaries();
  }, [selectedMonth]);

  // Tổng hợp tháng
  const totalMonthRevenue = summaries.reduce((s, d) => s + (d.totalRevenue || 0), 0);
  const totalMonthExpense = summaries.reduce((s, d) => s + (d.totalExpense || 0), 0);
  const totalMonthOrders = summaries.reduce((s, d) => s + (d.totalOrders || 0), 0);
  const netProfitMonth = totalMonthRevenue - totalMonthExpense;

  // Hàm Đối soát / Tính lại ngày (recalculateDay)
  const handleRecalculateDay = async (dateStr: string) => {
    try {
      setRecalculatingDate(dateStr);

      // 1. Quét orders ACTIVE
      const orderQ = query(
        collection(db, "orders"),
        where("dateString", "==", dateStr),
        where("status", "==", "ACTIVE")
      );
      const orderSnap = await getDocs(orderQ);
      let calculatedRevenue = 0;
      let calculatedOrders = 0;
      orderSnap.forEach((d) => {
        calculatedRevenue += (d.data().totalAmount as number) || 0;
        calculatedOrders++;
      });

      // 2. Quét expenses
      const expQ = query(
        collection(db, "expenses"),
        where("dateString", "==", dateStr)
      );
      const expSnap = await getDocs(expQ);
      let calculatedExpense = 0;
      expSnap.forEach((d) => {
        calculatedExpense += (d.data().amount as number) || 0;
      });

      // 3. Cập nhật lại daily_summaries
      const monthStr = dateStr.substring(0, 7);
      await setDoc(
        doc(db, "daily_summaries", dateStr),
        {
          totalRevenue: calculatedRevenue,
          totalExpense: calculatedExpense,
          totalOrders: calculatedOrders,
          dateString: dateStr,
          monthString: monthStr,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      alert(`✔ Đã đối soát xong ngày ${dateStr}!\n- Doanh thu: ${vnd(calculatedRevenue)}\n- Chi phí: ${vnd(calculatedExpense)}\n- Số đơn: ${calculatedOrders}`);
      await fetchMonthlySummaries();
    } catch (err) {
      alert("Lỗi khi đối soát ngày: " + (err as Error).message);
    } finally {
      setRecalculatingDate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Báo Cáo Doanh Thu Tháng</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Thống kê doanh thu, chi phí, lợi nhuận ròng và công cụ đối soát sổ sách
          </p>
        </div>

        {/* Month Picker */}
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

      {/* 4 Monthly KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-3xl bg-indigo-600 text-white p-5 shadow-lg shadow-indigo-600/20">
          <div className="flex items-center space-x-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-indigo-200" />
            <span>Doanh Thu Tháng</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-2 text-white">{vnd(totalMonthRevenue)}</div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Tổng Tiền Đã Chi</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-2 text-slate-900">- {vnd(totalMonthExpense)}</div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Lợi Nhuận Ròng</span>
          </div>
          <div className={`text-xl md:text-2xl font-black mt-2 ${netProfitMonth >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {vnd(netProfitMonth)}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <CalendarDays className="w-4 h-4" />
            <span>Tổng Đơn Bán</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-2 text-slate-900">{totalMonthOrders} đơn</div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Bảng Kê Chi Tiết Từng Ngày Trong Tháng {selectedMonth}
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{summaries.length} ngày có dữ liệu</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-400">Đang tải bảng kê...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">Chưa có dữ liệu tháng này</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ngày</th>
                  <th className="py-3.5 px-4 text-right">Doanh Thu</th>
                  <th className="py-3.5 px-4 text-right">Tiền Chi</th>
                  <th className="py-3.5 px-4 text-right">Còn Lại (Bán - Chi)</th>
                  <th className="py-3.5 px-4 text-center">Số Đơn</th>
                  <th className="py-3.5 px-4 text-center">Đối Soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((day) => {
                  const dayNet = (day.totalRevenue || 0) - (day.totalExpense || 0);
                  const isRecalculating = recalculatingDate === day.dateString;

                  return (
                    <tr key={day.dateString} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {day.dateString}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-indigo-600 whitespace-nowrap">
                        {vnd(day.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600 whitespace-nowrap">
                        {day.totalExpense > 0 ? `- ${vnd(day.totalExpense)}` : "0 ₫"}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black whitespace-nowrap ${
                          dayNet >= 0 ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {vnd(dayNet)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {day.totalOrders || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRecalculateDay(day.dateString)}
                          disabled={isRecalculating}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center space-x-1 transition-colors"
                          title="Tính lại ngày này từ toàn bộ đơn hàng và phiếu chi"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin text-indigo-600" : ""}`} />
                          <span>{isRecalculating ? "Đang tính..." : "Đối soát"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

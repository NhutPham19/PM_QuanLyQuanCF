import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { doc, onSnapshot, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dateKey, vnd } from "@/lib/format";
import type { DailySummary } from "@/types";
import {
  Coffee,
  FolderTree,
  Receipt,
  Coins,
  BarChart3,
  FileSpreadsheet,
  Users,
  TrendingUp,
  ArrowRight,
  TrendingDown,
  Minus,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

// Lazy-load Recharts để đạt ngân sách hiệu năng nhẹ dưới 250KB
const RevenueChart = lazy(() => import("@/features/dashboard/RevenueChart"));

export const DashboardPage: React.FC = () => {
  const todayKey = dateKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = dateKey(yesterdayDate);

  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = useState<DailySummary | null>(null);
  const [last7Days, setLast7Days] = useState<{ date: string; displayDate: string; revenue: number; expense: number }[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  // 1. Realtime Listener cho doanh thu hôm nay
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "daily_summaries", todayKey),
      (snap) => {
        if (snap.exists()) {
          setTodaySummary(snap.data() as DailySummary);
        } else {
          setTodaySummary({
            dateString: todayKey,
            monthString: todayKey.substring(0, 7),
            totalRevenue: 0,
            totalExpense: 0,
            totalOrders: 0,
          });
        }
      },
      (error) => {
        console.warn("Lỗi listener daily_summaries:", error);
      }
    );

    return () => unsub();
  }, [todayKey]);

  // 2. Lấy dữ liệu hôm qua để so sánh tăng/giảm
  useEffect(() => {
    getDoc(doc(db, "daily_summaries", yesterdayKey))
      .then((snap) => {
        if (snap.exists()) {
          setYesterdaySummary(snap.data() as DailySummary);
        }
      })
      .catch(() => {});
  }, [yesterdayKey]);

  // 3. Lấy dữ liệu 7 ngày gần nhất cho biểu đồ
  useEffect(() => {
    const fetch7Days = async () => {
      try {
        setLoadingChart(true);
        const daysKeys: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          daysKeys.push(dateKey(d));
        }

        const currentMonth = todayKey.substring(0, 7);
        const q = query(
          collection(db, "daily_summaries"),
          where("monthString", "==", currentMonth)
        );

        const snaps = await getDocs(q);
        const summaryMap = new Map<string, DailySummary>();
        snaps.forEach((s) => summaryMap.set(s.id, s.data() as DailySummary));

        const chartData = daysKeys.map((key) => {
          const item = summaryMap.get(key);
          const parts = key.split("-");
          return {
            date: key,
            displayDate: `${parts[2]}/${parts[1]}`,
            revenue: item?.totalRevenue ?? 0,
            expense: item?.totalExpense ?? 0,
          };
        });

        setLast7Days(chartData);
      } catch (err) {
        console.warn("Lỗi tải biểu đồ:", err);
      } finally {
        setLoadingChart(false);
      }
    };

    fetch7Days();
  }, [todayKey]);

  // Tính so sánh hôm nay vs hôm qua
  const todayRev = todaySummary?.totalRevenue ?? 0;
  const yesterdayRev = yesterdaySummary?.totalRevenue ?? 0;
  let percentDiff: number | null = null;
  if (yesterdayRev > 0) {
    percentDiff = Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);
  }

  const netCash = todayRev - (todaySummary?.totalExpense ?? 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Tổng Quan Doanh Thu
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Dữ liệu trực tiếp ngày {todayKey.split("-").reverse().join("/")} (Giờ VN UTC+7)
          </p>
        </div>
      </div>

      {/* Hero Bento Card - Doanh thu hôm nay (Realtime) */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-300 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>DOANH THU HÔM NAY</span>
            </span>

            {/* So sánh với hôm qua */}
            {percentDiff !== null ? (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 ${
                  percentDiff > 0
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : percentDiff < 0
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {percentDiff > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : percentDiff < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>{percentDiff > 0 ? `+${percentDiff}%` : `${percentDiff}%`} so với hôm qua</span>
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-medium">
                Hôm qua: {yesterdayRev > 0 ? vnd(yesterdayRev) : "Chưa có đơn"}
              </span>
            )}
          </div>

          <div className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-white">
            {vnd(todayRev)}
          </div>

          {/* 3 Sub-metrics Bento */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6 pt-5 border-t border-white/10 text-center">
            <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <p className="text-[11px] text-orange-300 font-bold uppercase tracking-wider">Tiền đã chi</p>
              <p className="text-sm md:text-base font-extrabold text-white mt-1">
                - {vnd(todaySummary?.totalExpense ?? 0)}
              </p>
            </div>
            <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Còn lại (Bán - Chi)</p>
              <p className={`text-sm md:text-base font-extrabold mt-1 ${netCash >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
                {vnd(netCash)}
              </p>
            </div>
            <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">Đơn thành công</p>
              <p className="text-sm md:text-base font-extrabold text-white mt-1">
                {todaySummary?.totalOrders ?? 0} đơn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section - Biểu đồ 7 ngày gần nhất */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Dòng Tiền 7 Ngày Gần Nhất</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              So sánh Doanh thu (Xanh) và Chi phí (Cam)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
              <span>Doanh thu</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-md bg-orange-400 inline-block" />
              <span>Chi phí</span>
            </span>
          </div>
        </div>

        {loadingChart ? (
          <div className="w-full h-72 flex items-center justify-center bg-slate-50/60 rounded-2xl">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin" />
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="w-full h-72 flex items-center justify-center bg-slate-50 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400">Đang tải biểu đồ...</span>
              </div>
            }
          >
            <RevenueChart data={last7Days} />
          </Suspense>
        )}
      </div>

      {/* Lưới Thẻ Điều Hướng Nhanh Bento */}
      <div>
        {/* Nút Vào Máy Bán Hàng Nổi Bật */}
        <div className="mb-4">
          <Link
            to="/pos"
            className="group rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 md:p-6 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform flex-shrink-0">
                <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-1">
                  Mở Trực Tiếp Trên Trình Duyệt
                </span>
                <h3 className="text-base sm:text-xl font-black text-white">
                  Giao Diện Máy Bán Hàng (POS)
                </h3>
                <p className="text-xs text-emerald-100 font-medium line-clamp-1">
                  Hình ảnh món to rõ, chọn món Tại quán & Mang về, thanh toán 1 chạm
                </p>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform flex-shrink-0">
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>

        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Phân Hệ Quản Trị
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to="/products"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Món Ăn & Giá</h3>
              <p className="text-xs text-slate-500 mt-0.5">2 mức giá Tại quán / Mang về</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-sky-600">
              <span>Quản lý</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/categories"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderTree className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Danh Mục & Chi</h3>
              <p className="text-xs text-slate-500 mt-0.5">Nhóm đồ uống & loại chi</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-teal-600">
              <span>Quản lý</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/orders"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Lịch Sử Đơn</h3>
              <p className="text-xs text-slate-500 mt-0.5">Xem đơn & nút Hủy/Khôi phục</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-orange-600">
              <span>Quản lý</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/expenses"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Sổ Tiền & Chi Phí</h3>
              <p className="text-xs text-slate-500 mt-0.5">Nhập hàng & mua đồ dùng</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-amber-600">
              <span>Quản lý</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/reports"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Báo Cáo Tháng</h3>
              <p className="text-xs text-slate-500 mt-0.5">Lợi nhuận & sao kê từng ngày</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
              <span>Xem báo cáo</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/export"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Xuất Báo Cáo CSV</h3>
              <p className="text-xs text-slate-500 mt-0.5">Xuất file Excel tiếng Việt</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-indigo-600">
              <span>Tải file</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/staff"
            className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between col-span-2 md:col-span-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-900">Cấp Tài Khoản</h3>
              <p className="text-xs text-slate-500 mt-0.5">Phân quyền Admin & POS Ba Mẹ</p>
            </div>
            <div className="mt-3 flex items-center text-xs font-bold text-purple-600">
              <span>Quản lý</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

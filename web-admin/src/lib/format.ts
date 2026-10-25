// Định dạng tiền tệ VND chuẩn Việt Nam
export const vnd = (n: number | null | undefined): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
};

// Trả về YYYY-MM-DD theo giờ Việt Nam (Asia/Ho_Chi_Minh)
export const dateKey = (d: Date = new Date()): string => {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
};

// Trả về YYYY-MM theo giờ Việt Nam
export const monthKey = (d: Date = new Date()): string => {
  return dateKey(d).substring(0, 7);
};

// Định dạng ngày giờ hiển thị (HH:mm, DD/MM/YYYY)
export const formatTimeVn = (isoStringOrDate: string | Date | null | undefined): string => {
  if (!isoStringOrDate) return "--:--";
  const d = typeof isoStringOrDate === "string" ? new Date(isoStringOrDate) : isoStringOrDate;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

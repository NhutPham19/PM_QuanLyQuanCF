// Cloudinary Client-side Unsigned Upload & Transform (Zero Secrets)

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "v6mzvfbb";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "qlcf_unsigned";
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "pm_quanlyquancf";

/**
 * Tạo URL ảnh Cloudinary cắt vuông 300x300, nén nhẹ tự động tối ưu cho máy yếu
 */
export function getOptimizedImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) return rawUrl;

  if (rawUrl.includes("/image/upload/") && !rawUrl.includes("w_300")) {
    return rawUrl.replace(
      "/image/upload/",
      "/image/upload/w_300,h_300,c_fill,q_auto,f_auto/"
    );
  }
  return rawUrl;
}

/**
 * Upload ảnh trực tiếp lên Cloudinary bằng Unsigned Preset
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", FOLDER);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload ảnh lên Cloudinary thất bại: HTTP ${res.status}`);
  }

  const data = await res.json();
  const secureUrl = data.secure_url as string;
  return getOptimizedImageUrl(secureUrl) || secureUrl;
}

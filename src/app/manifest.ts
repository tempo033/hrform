import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نظام الموارد البشرية — شركة البنية الأساسية للمقاولات",
    short_name: "الموارد البشرية",
    description:
      "منظومة متكاملة لإدارة شؤون الموظفين وفق نظام العمل السعودي: الموظفون، الإقامات، الكفالة، النماذج الرسمية، انتهاء العلاقة التعاقدية وحساب مكافأة نهاية الخدمة.",
    lang: "ar",
    dir: "rtl",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#ecefed",
    theme_color: "#0a1613",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "قائمة الموظفين", url: "/employees", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "الإقامات", url: "/iqama", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "حاسبة نهاية الخدمة", url: "/eos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "النماذج الرسمية", url: "/forms", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

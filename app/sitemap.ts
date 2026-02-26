import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://layali-kashtat.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = [
    "",
    "/haraj",
    "/gallery",
    "/request/service",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  }));

  // Dynamic Haraj Items
  let harajItems: any[] = [];
  try {
    const res = await db.query("SELECT id, created_at FROM haraj_items ORDER BY created_at DESC LIMIT 100");
    harajItems = res.rows.map((item) => ({
      url: `${baseUrl}/haraj/${item.id}`,
      lastModified: new Date(item.created_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error("Sitemap generation error:", e);
  }

  return [...routes, ...harajItems];
}

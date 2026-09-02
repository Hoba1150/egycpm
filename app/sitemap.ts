import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://egy-cpm.vercel.app";

  const staticUrls = [
    "",
    "/shop",
    "/cars",
    "/services",
    "/accounts",
    "/deposit",
    "/faq",
    "/terms",
    "/privacy",
    "/contact",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  return staticUrls;
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory IP Geolocation Cache to keep response ultra fast (< 2ms) and avoid external rate limits
const geoCache = new Map<string, { country: string; countryCode: string; city: string; region: string; exp: number }>();

function parseUserAgent(ua: string) {
  let device = "Desktop";
  let browser = "Other";
  let os = "Other";

  if (!ua) return { device, browser, os };

  // Device detection
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) {
    device = "Mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    device = "Tablet";
  } else if (/bot|crawler|spider|googlebot|bingbot/i.test(ua)) {
    device = "Bot";
  }

  // OS detection
  if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/windows nt/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser detection
  if (/telegram/i.test(ua)) browser = "Telegram App";
  else if (/instagram/i.test(ua)) browser = "Instagram App";
  else if (/tiktok/i.test(ua)) browser = "TikTok App";
  else if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/opr|opera/i.test(ua)) browser = "Opera";

  return { device, browser, os };
}

function parseReferrer(ref: string) {
  if (!ref) return "Direct / مباشر";
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes("google")) return "Google Search";
    if (host.includes("t.me") || host.includes("telegram")) return "Telegram";
    if (host.includes("discord")) return "Discord";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("twitter") || host.includes("x.com")) return "Twitter (X)";
    return host;
  } catch {
    return "Direct / مباشر";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path : "/";
    const clientReferrer = typeof body.referrer === "string" ? body.referrer : "";

    // Ignore admin visits so we don't pollute customer analytics
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    const ua = req.headers.get("user-agent") || "";
    const { device, browser, os } = parseUserAgent(ua);

    // Skip bots from metrics
    if (device === "Bot") {
      return NextResponse.json({ ok: true });
    }

    // IP Extraction
    const forwarded = req.headers.get("x-forwarded-for");
    let ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";

    // Vercel Geolocation Headers (Provided for free with 0 latency)
    let country = req.headers.get("x-vercel-ip-country-name") || req.headers.get("x-vercel-ip-country");
    let countryCode = req.headers.get("x-vercel-ip-country");
    let city = req.headers.get("x-vercel-ip-city");
    let region = req.headers.get("x-vercel-ip-country-region");

    // If not on Vercel or headers absent, check IP cache or ip-api.com
    if ((!country || !city) && ip && ip !== "127.0.0.1" && ip !== "::1" && !ip.startsWith("192.168.") && !ip.startsWith("10.")) {
      const cached = geoCache.get(ip);
      if (cached && cached.exp > Date.now()) {
        country = cached.country;
        countryCode = cached.countryCode;
        city = cached.city;
        region = cached.region;
      } else {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
            signal: AbortSignal.timeout(1500),
          });
          if (geoRes.ok) {
            const data = await geoRes.json();
            if (data && data.status === "success") {
              country = data.country || country;
              countryCode = data.countryCode || countryCode;
              city = data.city || city;
              region = data.regionName || region;
              geoCache.set(ip, {
                country: country || "Unknown",
                countryCode: countryCode || "UN",
                city: city || "Unknown",
                region: region || "Unknown",
                exp: Date.now() + 10 * 60 * 1000, // 10 minutes cache
              });
            }
          }
        } catch {
          // Non-blocking fallback
        }
      }
    }

    // Default country for common Arabic traffic if unresolved
    if (!country) {
      country = "مصر / Egypt";
      countryCode = "EG";
      city = "Cairo";
    }

    const referrer = parseReferrer(clientReferrer || req.headers.get("referer") || "");

    // Anonymize IP slightly for privacy (e.g. 197.35.xxx.xxx)
    const anonymizedIp = ip.split(".").length === 4
      ? ip.split(".").slice(0, 3).join(".") + ".xxx"
      : ip;

    // Asynchronous background insertion
    await prisma.pageView.create({
      data: {
        path,
        ip: anonymizedIp,
        country: country || "Unknown",
        countryCode: countryCode || "UN",
        city: city || "Unknown",
        region: region || "",
        device,
        browser,
        os,
        referrer,
        userAgent: ua.substring(0, 255),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

import { NextResponse } from "next/server";
import { parseM3U } from "@/app/lib/parseM3u";

const M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";

export async function GET() {
  try {
    const res = await fetch(M3U_URL, {
      // Use Next.js data cache with 30-minute revalidation
      next: { revalidate: 1800 },
      headers: { "User-Agent": "iptv-player/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch playlist: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const channels = parseM3U(text);

    return NextResponse.json(
      { channels },
      {
        headers: {
          // Tell the CDN/browser to cache for 30 minutes
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("Error fetching M3U playlist:", err);
    return NextResponse.json(
      { error: "Failed to load playlist" },
      { status: 500 }
    );
  }
}

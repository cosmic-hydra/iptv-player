import { NextResponse } from "next/server";
import { parseM3U } from "@/app/lib/parseM3u";

// Multiple M3U sources with fallback support
// Using GitHub raw content URLs which are more reliable
const M3U_SOURCES = [
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u", // India streams
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u", // US streams
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk.m3u", // UK streams
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ca.m3u", // Canada streams
  "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8", // Alternative source
];

async function fetchPlaylist(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "iptv-player/1.0",
        "Accept": "*/*",
      },
      // Don't use Next.js cache for individual sources
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    console.warn(`Error fetching ${url}:`, err);
    return null;
  }
}

export async function GET() {
  try {
    // Fetch all sources in parallel
    const results = await Promise.all(
      M3U_SOURCES.map(url => fetchPlaylist(url))
    );

    // Combine all successful results
    let combinedText = "#EXTM3U\n";
    let successCount = 0;

    for (let i = 0; i < results.length; i++) {
      const text = results[i];
      if (text && text.trim()) {
        successCount++;
        // Remove #EXTM3U header from individual playlists
        const cleanText = text.replace(/^#EXTM3U\s*\n?/i, "");
        combinedText += cleanText;
        if (!cleanText.endsWith("\n")) {
          combinedText += "\n";
        }
      }
    }

    if (successCount === 0) {
      return NextResponse.json(
        { error: "Failed to fetch any playlists. All sources are unavailable." },
        { status: 502 }
      );
    }

    const channels = parseM3U(combinedText);

    console.log(`Successfully loaded ${channels.length} channels from ${successCount}/${M3U_SOURCES.length} sources`);

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

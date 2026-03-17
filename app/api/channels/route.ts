import { NextResponse } from "next/server";
import { parseM3U } from "@/app/lib/parseM3u";

// Multiple M3U sources with fallback support
// Using GitHub raw content URLs which are more reliable
// Prioritized with India/Tamil channels first for faster loading
const M3U_SOURCES = [
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u", // India streams (Tamil priority)
  "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8", // Alternative source with regional content
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u", // US streams
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk.m3u", // UK streams
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ca.m3u", // Canada streams
];

async function fetchPlaylist(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      headers: {
        "User-Agent": "iptv-player/2.0",
        "Accept": "*/*",
        "Connection": "keep-alive",
      },
      // Don't use Next.js cache for individual sources
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn(`Timeout fetching ${url}`);
    } else {
      console.warn(`Error fetching ${url}:`, err);
    }
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

    // Prioritize Tamil and Indian channels for faster access
    const prioritizedChannels = channels.sort((a, b) => {
      // Tamil channels first
      const aTamil = a.language?.toLowerCase().includes('tamil') ||
                     a.name.toLowerCase().includes('tamil') ||
                     a.name.toLowerCase().includes('zee tamil') ||
                     a.name.toLowerCase().includes('sun tv');
      const bTamil = b.language?.toLowerCase().includes('tamil') ||
                     b.name.toLowerCase().includes('tamil') ||
                     b.name.toLowerCase().includes('zee tamil') ||
                     b.name.toLowerCase().includes('sun tv');

      if (aTamil && !bTamil) return -1;
      if (!aTamil && bTamil) return 1;

      // Then Indian channels
      const aIndian = a.country?.toLowerCase().includes('india') || a.country?.toLowerCase() === 'in';
      const bIndian = b.country?.toLowerCase().includes('india') || b.country?.toLowerCase() === 'in';

      if (aIndian && !bIndian) return -1;
      if (!aIndian && bIndian) return 1;

      return 0; // Keep original order for others
    });

    console.log(`Successfully loaded ${prioritizedChannels.length} channels from ${successCount}/${M3U_SOURCES.length} sources`);

    return NextResponse.json(
      { channels: prioritizedChannels },
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

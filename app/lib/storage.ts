import type { Channel } from "@/app/lib/parseM3u";

const RECENT_KEY = "iptv-recent-channels";
const MAX_RECENT = 6;

export function getRecentChannels(): Channel[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentChannel(channel: Channel): void {
  if (typeof window === "undefined") return;

  try {
    const recent = getRecentChannels();
    // Remove if already exists
    const filtered = recent.filter((c) => c.url !== channel.url);
    // Add to front
    const updated = [channel, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save recent channel:", err);
  }
}

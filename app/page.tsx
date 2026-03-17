"use client";

import { useEffect, useState } from "react";
import type { Channel } from "@/app/lib/parseM3u";
import ChannelList from "@/app/components/ChannelList";
import VideoPlayer from "@/app/components/VideoPlayer";
import PerformanceOptimizer from "@/app/components/PerformanceOptimizer";
import { addRecentChannel } from "@/app/lib/storage";

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    addRecentChannel(channel);
  };

  useEffect(() => {
    // Use AbortController for cleanup
    const controller = new AbortController();

    fetch("/api/channels", {
      signal: controller.signal,
      // Use browser cache if available
      cache: "force-cache",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setChannels(data.channels ?? []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message ?? "Failed to load channels");
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main className="flex flex-col h-screen bg-gray-950 text-white">
      <PerformanceOptimizer />
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h1 className="text-xl font-bold tracking-tight">IPTV Player</h1>
        {selectedChannel && (
          <span className="ml-auto text-sm text-gray-400 truncate max-w-xs">
            Now watching: <span className="text-white font-medium">{selectedChannel.name}</span>
          </span>
        )}
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Sidebar: channel list */}
        <aside className="w-80 flex-shrink-0 h-full">
          <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            onSelect={handleSelectChannel}
            loading={loading}
            error={error}
          />
        </aside>

        {/* Player */}
        <div className="flex-1 h-full">
          <VideoPlayer
            url={selectedChannel?.url ?? null}
            channelName={selectedChannel?.name ?? null}
          />
        </div>
      </div>
    </main>
  );
}

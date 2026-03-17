"use client";

import { useEffect, useRef, useState } from "react";
import type { Channel } from "@/app/lib/parseM3u";

interface VirtualChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelect: (channel: Channel) => void;
}

const ITEM_HEIGHT = 64; // Height of each channel item in pixels
const OVERSCAN = 3; // Number of items to render outside viewport

export default function VirtualChannelList({
  channels,
  selectedChannel,
  onSelect,
}: VirtualChannelListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    channels.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleChannels = channels.slice(startIndex, endIndex);
  const totalHeight = channels.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
      style={{ height: "100%" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleChannels.map((channel, idx) => {
            const actualIndex = startIndex + idx;
            return (
              <button
                key={`${channel.id}-${actualIndex}`}
                onClick={() => onSelect(channel)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-700 border-b border-gray-800 ${
                  selectedChannel?.url === channel.url
                    ? "bg-blue-600/20 border-l-2 border-l-blue-500"
                    : ""
                }`}
                style={{ height: ITEM_HEIGHT }}
              >
                {channel.logo ? (
                  <div className="w-10 h-7 flex-shrink-0 bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-7 flex-shrink-0 bg-gray-700 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                  <p className="text-gray-400 text-xs truncate">{channel.group}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

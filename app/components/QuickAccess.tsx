"use client";

import { useEffect, useState } from "react";
import type { Channel } from "@/app/lib/parseM3u";
import { getRecentChannels } from "@/app/lib/storage";

interface QuickAccessProps {
  channels: Channel[];
  onSelect: (channel: Channel) => void;
}

export default function QuickAccess({ channels, onSelect }: QuickAccessProps) {
  const [recentChannels, setRecentChannels] = useState<Channel[]>([]);

  useEffect(() => {
    setRecentChannels(getRecentChannels());
  }, []);

  // If we have recent channels, use them
  if (recentChannels.length > 0) {
    return (
      <div className="mb-4">
        <h3 className="text-white font-semibold text-sm mb-3 px-1 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recently Watched
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {recentChannels.map((channel, index) => (
            <button
              key={`${channel.id}-${index}`}
              onClick={() => onSelect(channel)}
              className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              {channel.logo ? (
                <div className="w-8 h-6 flex-shrink-0 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-8 h-6 flex-shrink-0 bg-gray-700 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium truncate">{channel.name}</p>
                <p className="text-gray-400 text-[10px] truncate">{channel.group}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Otherwise show popular channels
  const popularGroups = ["News", "Entertainment", "Sports", "Music", "Documentary", "Movies"];
  const quickChannels = channels
    .filter((c) => popularGroups.some((g) => c.group.toLowerCase().includes(g.toLowerCase())))
    .slice(0, 6);

  // If no matches, just show first 6 channels
  const displayChannels = quickChannels.length > 0 ? quickChannels : channels.slice(0, 6);

  if (displayChannels.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-white font-semibold text-sm mb-3 px-1 flex items-center gap-2">
        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Quick Access
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {displayChannels.map((channel, index) => (
          <button
            key={`${channel.id}-${index}`}
            onClick={() => onSelect(channel)}
            className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            {channel.logo ? (
              <div className="w-8 h-6 flex-shrink-0 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-8 h-6 flex-shrink-0 bg-gray-700 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{channel.name}</p>
              <p className="text-gray-400 text-[10px] truncate">{channel.group}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Channel } from "@/app/lib/parseM3u";
import QuickAccess from "@/app/components/QuickAccess";
import VirtualChannelList from "@/app/components/VirtualChannelList";

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelect: (channel: Channel) => void;
  loading: boolean;
  error: string | null;
}

export default function ChannelList({
  channels,
  selectedChannel,
  onSelect,
  loading,
  error,
}: ChannelListProps) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  const groups = useMemo(() => {
    const set = new Set(channels.map((c) => c.group));
    return ["All", ...Array.from(set).sort()];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return channels.filter((c) => {
      const matchesGroup = selectedGroup === "All" || c.group === selectedGroup;
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.language.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [channels, search, selectedGroup]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Channels
          {!loading && (
            <span className="ml-auto text-xs text-gray-400 font-normal">
              {filtered.length} / {channels.length}
            </span>
          )}
        </h2>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Group filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!loading && !error && channels.length > 0 && (
          <div className="p-3 border-b border-gray-800">
            <QuickAccess channels={channels} onSelect={onSelect} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            <p className="text-sm">Loading channels…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-red-400 font-medium mb-1">Failed to load channels</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">No channels found</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <VirtualChannelList
            channels={filtered}
            selectedChannel={selectedChannel}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useReducer, useRef } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  url: string | null;
  channelName: string | null;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

type Action =
  | { type: "LOAD" }
  | { type: "READY" }
  | { type: "ERROR"; message: string };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "LOAD":
      return { status: "loading" };
    case "READY":
      return { status: "ready" };
    case "ERROR":
      return { status: "error", message: action.message };
    default:
      return { status: "idle" };
  }
}

export default function VideoPlayer({ url, channelName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, dispatch] = useReducer(reducer, { status: "idle" });

  useEffect(() => {
    if (!url || !videoRef.current) return;

    dispatch({ type: "LOAD" });

    // Destroy any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        dispatch({ type: "READY" });
        video.play().catch(() => {
          // Autoplay may be blocked; user can click play manually
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          let message = "An error occurred while loading the stream.";
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            message = "Network error: unable to load stream. The channel may be offline.";
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            message = "Media error: unsupported format or corrupted stream.";
          }
          dispatch({ type: "ERROR", message });
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari)
      video.src = url;
      video.addEventListener(
        "loadedmetadata",
        () => {
          dispatch({ type: "READY" });
          video.play().catch(() => {});
        },
        { once: true }
      );
      video.addEventListener(
        "error",
        () => {
          dispatch({ type: "ERROR", message: "Unable to play this stream in your browser." });
        },
        { once: true }
      );
    } else {
      dispatch({ type: "ERROR", message: "HLS playback is not supported in this browser." });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 rounded-xl text-gray-400">
        <svg
          className="w-16 h-16 mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-lg font-medium">Select a channel to start watching</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      {channelName && (
        <div className="absolute top-3 left-3 z-10 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
          {channelName}
        </div>
      )}

      {state.status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      )}

      {state.status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900 text-center px-4">
          <svg
            className="w-12 h-12 text-red-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-400 font-medium mb-1">Stream Unavailable</p>
          <p className="text-gray-400 text-sm">{state.message}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        autoPlay
      />
    </div>
  );
}

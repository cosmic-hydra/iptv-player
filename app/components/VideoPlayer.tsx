"use client";

import { useEffect, useReducer, useRef, useState } from "react";
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
  const retryCountRef = useRef(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [quality, setQuality] = useState<string>("auto");
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!url || !videoRef.current) return;

    dispatch({ type: "LOAD" });
    retryCountRef.current = 0;
    startTimeRef.current = Date.now();

    // Destroy any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    // Reset loading progress
    const updateProgress = (value: number) => {
      setLoadingProgress(value);
    };

    updateProgress(0);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Maximum performance optimizations for streaming
        backBufferLength: 90,
        maxBufferLength: 8,          // Further reduced to 8 for fastest start
        maxMaxBufferLength: 20,      // Further reduced to 20 for aggressive playback
        maxLoadingDelay: 1,          // Reduced to 1 for immediate loading
        maxBufferHole: 0.3,          // Smaller holes for smoother playback
        highBufferWatchdogPeriod: 1, // More frequent buffer checks
        // Aggressive fragment loading and prefetching
        startFragPrefetch: true,     // Enable fragment prefetching
        testBandwidth: false,        // Skip bandwidth test for instant start
        progressive: true,           // Enable progressive streaming
        // Network retry settings - optimized for maximum speed
        manifestLoadingTimeOut: 6000,      // Further reduced to 6s
        manifestLoadingMaxRetry: 6,        // More retries for reliability
        manifestLoadingRetryDelay: 300,    // Faster retry at 300ms
        levelLoadingTimeOut: 6000,         // Further reduced to 6s
        levelLoadingMaxRetry: 6,
        levelLoadingRetryDelay: 300,
        fragLoadingTimeOut: 10000,         // Further reduced to 10s
        fragLoadingMaxRetry: 8,            // More retries for fragments
        fragLoadingRetryDelay: 200,        // Faster fragment retry at 200ms
        // Performance optimizations
        maxFragLookUpTolerance: 0.2,       // Faster fragment lookup
        liveSyncDurationCount: 2,          // Minimum live edge sync
        liveMaxLatencyDurationCount: 3,    // Maximum latency for live streams
        // Adaptive streaming for bandwidth
        abrEwmaDefaultEstimate: 500000,    // Start with 500kbps estimate
        abrBandWidthFactor: 0.95,          // Aggressive bandwidth utilization
        abrBandWidthUpFactor: 0.7,         // Quick quality upgrades
        // Connection optimizations
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.timeout = 10000;             // 10s timeout for all requests
          // Add headers to bypass some blocking
          xhr.setRequestHeader('User-Agent', 'iptv-player/2.0');
          xhr.setRequestHeader('Accept', '*/*');
        },
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        updateProgress(10);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        updateProgress(50);
        dispatch({ type: "READY" });

        // Track loading performance
        const loadTime = Date.now() - startTimeRef.current;
        console.log(`Stream loaded in ${loadTime}ms for ${channelName}`);

        video.play().catch(() => {
          // Autoplay may be blocked; user can click play manually
        });
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        updateProgress(75);
      });

      // Monitor bandwidth and quality changes
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          const qualityLabel = `${level.height}p` || `${Math.round(level.bitrate / 1000)}kbps`;
          setQuality(qualityLabel);
          console.log(`Quality switched to: ${qualityLabel}`);
        }
      });

      video.addEventListener("loadeddata", () => {
        updateProgress(100);
      }, { once: true });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("HLS Error:", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Network error encountered, attempting recovery...");
              if (retryCountRef.current < 3) {
                retryCountRef.current++;
                setTimeout(() => {
                  console.log(`Retry attempt ${retryCountRef.current}/3`);
                  hls.startLoad();
                }, 1000 * retryCountRef.current);
              } else {
                dispatch({
                  type: "ERROR",
                  message: "Network error: unable to load stream. The channel may be offline or blocked.",
                });
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Media error encountered, attempting recovery...");
              if (retryCountRef.current < 2) {
                retryCountRef.current++;
                hls.recoverMediaError();
              } else {
                dispatch({
                  type: "ERROR",
                  message: "Media error: unsupported format or corrupted stream.",
                });
              }
              break;
            default:
              dispatch({
                type: "ERROR",
                message: "An error occurred while loading the stream.",
              });
          }
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
  }, [url, retryAttempt, channelName]);

  const handleRetry = () => {
    setRetryAttempt((prev) => prev + 1);
  };

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

      {quality !== "auto" && state.status === "ready" && (
        <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {quality}
        </div>
      )}

      {state.status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
          <p className="text-white text-sm mb-2">Loading stream...</p>
          <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
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
          <p className="text-gray-400 text-sm mb-4">{state.message}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
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

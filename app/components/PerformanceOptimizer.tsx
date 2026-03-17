"use client";

import { useEffect } from "react";

/**
 * Component that handles performance optimizations like preloading connections
 * for common streaming domains to reduce latency when switching channels
 */
export default function PerformanceOptimizer() {
  useEffect(() => {
    // Preload connections to common streaming domains
    // This reduces DNS lookup and connection establishment time
    const commonDomains = [
      "https://raw.githubusercontent.com",
      "https://github.com",
    ];

    // Create link elements for preconnect if they don't exist
    commonDomains.forEach((domain) => {
      const existing = document.querySelector(`link[href="${domain}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = domain;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    });

    // Warm up service worker cache if available
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      console.log("Service worker active, cache warming may be available");
    }
  }, []);

  return null; // This component doesn't render anything
}

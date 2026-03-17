# IPTV Streaming Fixes

This document outlines the improvements made to fix streaming issues for channels like Sun TV, Zee TV, and others.

## Problems Identified

1. **Single source dependency**: The original implementation relied on a single M3U playlist URL (`https://iptv-org.github.io/iptv/index.m3u`) which may be deprecated or unavailable
2. **No error recovery**: When streams failed, there was no automatic retry mechanism
3. **Limited error handling**: HLS.js wasn't configured with robust error recovery settings
4. **No CORS handling**: Some streams may be blocked due to CORS restrictions
5. **No URL validation**: Invalid URLs could crash the parser

## Solutions Implemented

### 1. Multiple M3U Sources with Fallback (app/api/channels/route.ts)

**Changes:**
- Added multiple M3U playlist sources including:
  - India streams (for Sun TV, Zee TV, etc.)
  - US streams
  - UK streams
  - Canada streams
  - Alternative Free-TV source
- Implemented parallel fetching of all sources
- Combined successful results into a single channel list
- Graceful degradation: Works as long as at least one source is available

**Benefits:**
- Higher availability - if one source fails, others can still work
- More channels - combines channels from multiple sources
- Better geographic coverage - includes region-specific playlists

### 2. Enhanced Error Recovery (app/components/VideoPlayer.tsx)

**Changes:**
- Added automatic retry logic for network errors (up to 3 attempts)
- Added media error recovery (up to 2 attempts)
- Configured HLS.js with robust timeout and retry settings:
  - `manifestLoadingMaxRetry: 4`
  - `levelLoadingMaxRetry: 4`
  - `fragLoadingMaxRetry: 6`
  - Extended timeout values for slow connections
- Added manual retry button in error UI
- Added detailed error logging for debugging

**Benefits:**
- Streams recover automatically from temporary network issues
- Better handling of slow or unreliable connections
- User can manually retry failed streams
- Better visibility into what went wrong

### 3. URL Validation (app/lib/parseM3u.ts)

**Changes:**
- Added `isValidUrl()` function to validate stream URLs
- Skip invalid URLs instead of crashing
- Added logging for skipped invalid channels
- Added channel count logging

**Benefits:**
- More robust parsing - won't crash on malformed playlists
- Better debugging - can see which URLs are invalid
- Cleaner channel list - only includes valid streams

### 4. CORS Proxy (app/api/proxy/route.ts)

**Changes:**
- Created a new API endpoint `/api/proxy`
- Proxies stream requests to bypass CORS restrictions
- Handles range requests for video seeking
- Preserves all necessary headers

**Benefits:**
- Can play streams that would otherwise be blocked by CORS
- Maintains full video player functionality (seeking, etc.)
- Simple to use - just wrap the URL

**Usage:**
```javascript
// Instead of using the stream URL directly:
const directUrl = "https://example.com/stream.m3u8";

// Use the proxy:
const proxiedUrl = `/api/proxy?url=${encodeURIComponent(directUrl)}`;
```

## How the Fixes Help Specific Channels

### Indian Channels (Sun TV, Zee TV, etc.)

1. **Dedicated India playlist**: The fix includes `streams/in.m3u` specifically for Indian channels
2. **Multiple sources**: If one source doesn't have these channels, another might
3. **Better error handling**: If a stream temporarily fails, it will retry automatically

### All Channels

1. **Higher availability**: Multiple sources mean more chances to find working streams
2. **Better reliability**: Automatic retry and recovery mechanisms
3. **CORS workaround**: Proxy available for blocked streams
4. **Better user experience**: Clear error messages and manual retry option

## Testing the Changes

### To verify the fixes:

1. **Check channel loading:**
   ```bash
   curl http://localhost:3000/api/channels | jq '.channels | length'
   ```
   Should return a count of available channels

2. **Test the proxy:**
   ```bash
   curl "http://localhost:3000/api/proxy?url=https://example.com/test.m3u8"
   ```

3. **Monitor browser console:**
   - Look for logs showing how many sources loaded successfully
   - Check for retry attempts when streams fail
   - Verify HLS error recovery messages

## Configuration

### Adding More M3U Sources

Edit `app/api/channels/route.ts`:

```typescript
const M3U_SOURCES = [
  "https://your-playlist-url-1.m3u",
  "https://your-playlist-url-2.m3u8",
  // Add more sources here
];
```

### Adjusting Retry Behavior

Edit `app/components/VideoPlayer.tsx`:

```typescript
// Network retry attempts (currently 3)
if (retryCountRef.current < 3) {
  retryCountRef.current++;
  // ...
}

// Media error recovery attempts (currently 2)
if (retryCountRef.current < 2) {
  retryCountRef.current++;
  // ...
}
```

### Tuning HLS.js Settings

Edit the HLS configuration in `app/components/VideoPlayer.tsx`:

```typescript
const hls = new Hls({
  // Buffer settings
  maxBufferLength: 30,           // Increase for slower connections
  maxMaxBufferLength: 60,        // Maximum buffer size

  // Retry settings
  manifestLoadingMaxRetry: 4,    // Increase for unreliable sources
  levelLoadingMaxRetry: 4,
  fragLoadingMaxRetry: 6,

  // Timeout settings (in milliseconds)
  manifestLoadingTimeOut: 10000, // Increase for slow servers
  levelLoadingTimeOut: 10000,
  fragLoadingTimeOut: 20000,
});
```

## Known Limitations

1. **Stream quality**: This app doesn't control the quality of the source streams
2. **Geographic restrictions**: Some streams may be geo-blocked
3. **Upstream availability**: If all M3U sources are down, channels won't load
4. **Performance**: Fetching multiple M3U sources adds initial load time (mitigated by caching)

## Future Enhancements

Potential improvements for even better reliability:

1. **Channel health monitoring**: Track which channels work and prioritize them
2. **User-contributed playlists**: Allow users to add their own M3U sources
3. **Stream quality selection**: Let users choose between different quality levels
4. **Favorites system**: Remember working channels for faster access
5. **EPG integration**: Add electronic program guide data
6. **Cache optimization**: Implement more aggressive caching strategies

## Support

If streams still aren't working:

1. Check browser console for error messages
2. Try the manual retry button
3. Check if the source M3U playlists are accessible
4. Verify network connectivity
5. Try different channels to isolate the issue

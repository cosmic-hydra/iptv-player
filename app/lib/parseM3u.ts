export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  language: string;
  country: string;
}

export function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split("\n");
  let current: Partial<Channel> | null = null;
  let index = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      current = {};

      // Extract channel name (after the last comma)
      const commaIdx = line.lastIndexOf(",");
      current.name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : "Unknown";

      // Extract attributes
      const attrStr = line.slice(8, commaIdx >= 0 ? commaIdx : undefined);
      current.logo = extractAttr(attrStr, "tvg-logo") ?? "";
      current.group = extractAttr(attrStr, "group-title") ?? "Other";
      current.language = extractAttr(attrStr, "tvg-language") ?? "";
      current.country = extractAttr(attrStr, "tvg-country") ?? "";
      current.id = extractAttr(attrStr, "tvg-id") ?? `channel-${index}`;
    } else if (line && !line.startsWith("#") && current) {
      current.url = line;
      channels.push({
        id: current.id || `channel-${index}`,
        name: current.name || "Unknown",
        url: current.url,
        logo: current.logo || "",
        group: current.group || "Other",
        language: current.language || "",
        country: current.country || "",
      });
      index++;
      current = null;
    }
  }

  return channels;
}

function extractAttr(str: string, attr: string): string | undefined {
  const regex = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = str.match(regex);
  return match ? match[1] : undefined;
}

import { NextRequest, NextResponse } from "next/server";

// Helper to decode basic HTML entities
function decodeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to extract content by regex
function extractMeta(html: string, regexList: RegExp[]): string {
  for (const regex of regexList) {
    const match = html.match(regex);
    if (match && match[1]) {
      return decodeHtml(match[1]);
    }
  }
  return "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  // Ensure protocol is prepended
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const parsedUrl = new URL(targetUrl);
    
    // Fetch target URL with a realistic User-Agent to avoid scraping blocks
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 }, // Cache on Next.js server for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json({ 
        url: targetUrl,
        title: parsedUrl.hostname,
        description: `Failed to load site. Response status: ${response.status}`,
        imageUrl: "",
        favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
      });
    }

    const html = await response.text();

    // Regex match rules (handling varying quote styles and attributes order)
    const titleRegexes = [
      /<title[^>]*>([\s\S]*?)<\/title>/i
    ];
    
    const descriptionRegexes = [
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i,
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i
    ];

    const ogTitleRegexes = [
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i
    ];

    const ogImageRegexes = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i
    ];

    const faviconRegexes = [
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i,
      /<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']/i,
      /<link[^>]*href=["']([^"']*)["'][^>]*rel=["']apple-touch-icon["']/i
    ];

    let title = extractMeta(html, ogTitleRegexes) || extractMeta(html, titleRegexes);
    if (!title) {
      title = parsedUrl.hostname;
    }

    const description = extractMeta(html, descriptionRegexes);
    
    let imageUrl = extractMeta(html, ogImageRegexes);
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = new URL(imageUrl, parsedUrl.origin).toString();
    }

    let favicon = extractMeta(html, faviconRegexes);
    if (favicon) {
      if (favicon.startsWith("//")) {
        favicon = "https:" + favicon;
      } else if (favicon.startsWith("/")) {
        favicon = new URL(favicon, parsedUrl.origin).toString();
      } else if (!/^https?:\/\//i.test(favicon)) {
        favicon = new URL(favicon, parsedUrl.origin).toString();
      }
    } else {
      // Fallback favicon
      favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
    }

    return NextResponse.json({
      url: targetUrl,
      title: title.trim(),
      description: description.trim() || "No description available.",
      imageUrl: imageUrl.trim(),
      favicon: favicon.trim(),
    });

  } catch (error: unknown) {
    console.error("Scraping error:", error);
    try {
      const parsedUrl = new URL(targetUrl);
      return NextResponse.json({
        url: targetUrl,
        title: parsedUrl.hostname,
        description: "Could not scrape metadata. This site may be blocking scraper bots or requires authentication.",
        imageUrl: "",
        favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
      });
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
  }
}

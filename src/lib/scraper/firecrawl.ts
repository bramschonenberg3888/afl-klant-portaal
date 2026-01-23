import Firecrawl from '@mendable/firecrawl-js';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { env } from '@/env';

export interface ScrapeResult {
  title: string;
  content: string;
  markdown: string;
  sourceUrl: string;
}

const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    // Try Firecrawl first
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      excludeTags: ['script', 'style', 'noscript', 'img', 'nav', 'footer', 'header'],
    });

    if (result.markdown) {
      return {
        title: result.metadata?.title || extractTitleFromUrl(url),
        content: result.markdown,
        markdown: result.markdown,
        sourceUrl: url,
      };
    }

    // Fall back to cheerio + readability
    return await fallbackScrape(url);
  } catch (error) {
    console.warn(`Firecrawl failed for ${url}, using fallback:`, error);
    return await fallbackScrape(url);
  }
}

async function fallbackScrape(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SafetyPortalBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();

  // Use Readability to extract main content
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (article) {
    return {
      title: article.title || extractTitleFromUrl(url),
      content: article.textContent || '',
      markdown: article.content || article.textContent || '',
      sourceUrl: url,
    };
  }

  // Fallback to basic cheerio extraction
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();

  const title = $('title').text() || $('h1').first().text() || extractTitleFromUrl(url);
  const content = $('main, article, .content, #content, body').first().text().trim();

  return {
    title,
    content,
    markdown: content,
    sourceUrl: url,
  };
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/\.\w+$/, '');
    }
    return urlObj.hostname;
  } catch {
    return 'Untitled Document';
  }
}

export async function scrapeMultipleUrls(urls: string[]): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const url of urls) {
    try {
      const result = await scrapeUrl(url);
      results.push(result);
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
    }
  }

  return results;
}

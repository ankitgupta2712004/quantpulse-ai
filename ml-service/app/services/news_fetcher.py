import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Clean and normalize financial news text."""
    if not text:
        return ""
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Strip URLs
    text = re.sub(r'http\S+|www\S+', ' ', text)
    # Strip unescaped XML entities
    text = text.replace('&amp;', '&').replace('&quot;', '"').replace('&apos;', "'").replace('&lt;', '<').replace('&gt;', '>')
    # Strip multiple whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fetch_stock_news(symbol: str) -> List[Dict[str, Any]]:
    """
    Fetch real financial news articles for a stock ticker symbol via official Yahoo Finance RSS feeds.
    Deduplicates and cleans articles.
    """
    clean_symbol = symbol.strip().upper()
    articles = []
    seen_titles = set()

    # 1. Primary Source: Official Yahoo Finance RSS Feed
    rss_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={clean_symbol}"
    
    try:
        req = urllib.request.Request(
            rss_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)

            for item in root.findall(".//item"):
                title_elem = item.find("title")
                link_elem = item.find("link")
                pub_elem = item.find("pubDate")
                desc_elem = item.find("description")

                title = clean_text(title_elem.text if title_elem is not None else "")
                link = link_elem.text.strip() if link_elem is not None and link_elem.text else f"https://finance.yahoo.com/quote/{clean_symbol}"
                desc = clean_text(desc_elem.text if desc_elem is not None else "")

                if not title or len(title) < 10:
                    continue

                # Deduplication check
                norm_title = title.lower()
                if norm_title in seen_titles:
                    continue
                seen_titles.add(norm_title)

                # Format publication date
                pub_str = datetime.now().strftime("%Y-%m-%d %H:%M")
                if pub_elem is not None and pub_elem.text:
                    try:
                        # RFC 822 / 1123 date parsing (e.g. "Wed, 30 Sep 2026 09:30:00 GMT")
                        dt = datetime.strptime(pub_elem.text[:25].strip(), "%a, %d %b %Y %H:%M:%S")
                        pub_str = dt.strftime("%Y-%m-%d %H:%M")
                    except Exception:
                        pub_str = pub_elem.text

                # Extract publisher from title if format is "Title - Publisher"
                publisher = "Yahoo Finance"
                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    if len(parts[1]) < 30:
                        publisher = parts[1].strip()

                articles.append({
                    "title": title,
                    "summary": desc,
                    "publisher": publisher,
                    "link": link,
                    "published_at": pub_str,
                    "symbol": clean_symbol,
                })

    except Exception as e:
        print(f"[NewsFetcher RSS] Error fetching RSS for {clean_symbol}: {e}")

    return articles

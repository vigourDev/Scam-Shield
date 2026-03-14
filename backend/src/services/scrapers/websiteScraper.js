import axios from 'axios';

const normalizeDomain = (value) => {
  if (!value) return null;
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return new URL(value).hostname.toLowerCase();
    }
    return value.trim().toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

// reportsCount:5 → score = (5×10)+20 = 70 → "Dangerous" (prevents false-safe results)
const mapRecord = (domain, source) => ({
  type: 'website',
  value: domain,
  category: 'phishing',
  description: `Public phishing indicator from ${source}`,
  source,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 5
});

export const scrapeWebsites = async (maxRecords = 500) => {
  const errors = [];
  const records = [];
  const seen = new Set();

  const pushDomain = (domain, source) => {
    const normalized = normalizeDomain(domain);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    records.push(mapRecord(normalized, source));
  };

  // URLhaus — API requires POST (not GET). Falls back to text download if API fails.
  try {
    const urlhausResponse = await axios.post(
      'https://urlhaus-api.abuse.ch/v1/urls/recent/',
      new URLSearchParams(),
      { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const urls = urlhausResponse.data?.urls || [];
    for (const item of urls) {
      if (records.length >= maxRecords) break;
      if (item?.url) pushDomain(item.url, 'urlhaus');
    }
  } catch (error) {
    errors.push(`URLhaus API error: ${error.message}`);
    // Fallback: URLhaus public text download (no auth required)
    try {
      const dump = await axios.get('https://urlhaus.abuse.ch/downloads/text_recent/', {
        timeout: 20000,
        headers: { 'User-Agent': 'ScamShield/1.0 (public threat intelligence)' }
      });
      const lines = (dump.data || '').split('\n').filter(l => l && !l.startsWith('#'));
      for (const line of lines) {
        if (records.length >= maxRecords) break;
        pushDomain(line.trim(), 'urlhaus_download');
      }
    } catch (fallbackErr) {
      errors.push(`URLhaus download fallback error: ${fallbackErr.message}`);
    }
  }

  // OpenPhish — free community phishing feed
  try {
    if (records.length < maxRecords) {
      const openPhishResponse = await axios.get('https://openphish.com/feed.txt', {
        timeout: 15000,
        headers: { 'User-Agent': 'ScamShield/1.0' }
      });
      const lines = (openPhishResponse.data || '').split('\n');
      for (const line of lines) {
        if (records.length >= maxRecords) break;
        if (line?.trim()) pushDomain(line.trim(), 'openphish');
      }
    }
  } catch (error) {
    errors.push(`OpenPhish error: ${error.message}`);
  }

  // Phishing.Army — large actively-maintained phishing blocklist (no auth required)
  try {
    if (records.length < maxRecords) {
      const armyResponse = await axios.get(
        'https://phishing.army/download/phishing_army_blocklist.txt',
        { timeout: 20000, headers: { 'User-Agent': 'ScamShield/1.0' } }
      );
      for (const line of (armyResponse.data || '').split('\n')) {
        if (records.length >= maxRecords) break;
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) pushDomain(trimmed, 'phishing_army');
      }
    }
  } catch (error) {
    errors.push(`PhishingArmy error: ${error.message}`);
  }

  // Fallback set keeps scraper useful when all sources fail
  if (records.length === 0) {
    ['paypa1.com', 'amaz0n-login-security.com', 'secure-appleid-check.net'].forEach((d) =>
      pushDomain(d, 'fallback_web_list')
    );
  }

  return {
    source: 'website_scraper',
    type: 'website',
    records: records.slice(0, maxRecords),
    errors
  };
};

/**
 * GitHub Scraper
 * Pulls scam intelligence from:
 * 1. A curated list of known GitHub repositories containing scam blocklists
 * 2. GitHub Search API (supports optional GITHUB_TOKEN env var for higher rate limits)
 *
 * GitHub Search API limits:
 *  - Unauthenticated: 10 requests/minute
 *  - Authenticated (GITHUB_TOKEN): 30 requests/minute
 */
import axios from 'axios';

const GITHUB_UA = 'ScamShield/1.0 (public scam intelligence aggregator)';

const PHONE_RE = /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const TELEGRAM_RE = /(?:https?:\/\/t\.me\/|@)([a-zA-Z0-9_]{5,})/g;
const WEBSITE_RE = /https?:\/\/((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/g;

const normalizeDomain = (v) => {
  try { return new URL(`https://${v}`).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return v.toLowerCase().replace(/^www\./, ''); }
};

const buildHeaders = () => {
  const headers = { 'User-Agent': GITHUB_UA, Accept: 'application/vnd.github.v3+json' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  return headers;
};

const mapRecord = (type, value, source, description) => ({
  type,
  value,
  category: type === 'website' || type === 'email' ? 'phishing' : 'impersonation',
  description: description || `Scam indicator from GitHub: ${source}`,
  source: `github_${source}`,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 5
});

/**
 * Curated list of known-working GitHub raw file URLs with scam data.
 * Each entry specifies the URL, what type of identifiers to extract, and the source label.
 */
const CURATED_SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/fastfire/deepdarkCTI/main/telegram_cybercrime.csv',
    type: 'telegram',
    source: 'deepdarkCTI_telegram',
    description: 'Dark web CTI Telegram cybercrime channels'
  },
  {
    url: 'https://raw.githubusercontent.com/fastfire/deepdarkCTI/main/phishing_url.csv',
    type: 'website',
    source: 'deepdarkCTI_phishing',
    description: 'Dark web CTI phishing URLs'
  },
  {
    url: 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE-NOW.txt',
    type: 'website',
    source: 'phishing_database_active',
    description: 'Active phishing links from Phishing.Database project'
  },
  {
    url: 'https://raw.githubusercontent.com/nickg/phishing-domains/main/domains.txt',
    type: 'website',
    source: 'nickg_phishing',
    description: 'Community phishing domain list'
  },
  {
    url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn-social/hosts',
    type: 'website',
    source: 'stevenblack_hosts',
    description: 'StevenBlack hosts blocklist'
  }
];

const parseTextForType = (text, type, source, seen) => {
  const results = [];
  const push = (t, v, desc) => {
    const key = `${t}:${v}`;
    if (!seen.has(key)) { seen.add(key); results.push(mapRecord(t, v, source, desc)); }
  };

  if (type === 'telegram' || type === 'all') {
    TELEGRAM_RE.lastIndex = 0;
    let m;
    while ((m = TELEGRAM_RE.exec(text)) !== null) {
      push('telegram', m[1].toLowerCase(), `Telegram scam handle from ${source}`);
      TELEGRAM_RE.lastIndex = m.index + 1;
    }
  }

  if (type === 'website' || type === 'all') {
    WEBSITE_RE.lastIndex = 0;
    let m;
    while ((m = WEBSITE_RE.exec(text)) !== null) {
      const domain = normalizeDomain(m[1]);
      if (['github.com', 'raw.githubusercontent.com', 'google.com'].includes(domain)) continue;
      push('website', domain, `Phishing domain from ${source}`);
      WEBSITE_RE.lastIndex = m.index + 1;
    }
    // Also treat bare-domain lines (hosts file format)
    for (const line of text.split('\n')) {
      const trimmed = line.replace(/^0\.0\.0\.0\s+/, '').replace(/^127\.0\.0\.1\s+/, '').trim();
      if (trimmed && !trimmed.startsWith('#') && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
        push('website', trimmed.toLowerCase(), `Blocked domain from ${source}`);
      }
    }
  }

  if (type === 'email' || type === 'all') {
    for (const m of (text.match(EMAIL_RE) || [])) {
      const v = m.toLowerCase();
      if (!v.includes('@github.com')) push('email', v, `Phishing email from ${source}`);
    }
  }

  if (type === 'phone' || type === 'all') {
    for (const m of (text.match(PHONE_RE) || [])) {
      const v = m.replace(/[^\d+]/g, '');
      if (v.length >= 8) push('phone', v, `Scam phone from ${source}`);
    }
  }

  return results;
};

/**
 * Fetch and parse a single curated GitHub raw URL
 */
const fetchCuratedSource = async (entry, seen, maxPer) => {
  const response = await axios.get(entry.url, {
    timeout: 20000,
    headers: { 'User-Agent': GITHUB_UA }
  });
  const text = response.data || '';
  return parseTextForType(text, entry.type, entry.source, seen).slice(0, maxPer);
};

/**
 * Search GitHub for scam-related repositories, then read their README/data files
 */
const searchGitHub = async (query, seen, maxRecords) => {
  const results = [];
  try {
    const searchResp = await axios.get(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=5`,
      { timeout: 15000, headers: buildHeaders() }
    );
    const repos = searchResp.data?.items || [];
    for (const repo of repos) {
      if (results.length >= maxRecords) break;
      try {
        // Read README for quick intelligence extraction
        const readmeResp = await axios.get(
          `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/README.md`,
          { timeout: 10000, headers: { 'User-Agent': GITHUB_UA } }
        );
        const extracted = parseTextForType(readmeResp.data || '', 'all', repo.full_name, seen);
        results.push(...extracted.slice(0, 20));
        await new Promise(r => setTimeout(r, 1000)); // Respect rate limits
      } catch {
        // Repo README not accessible, skip
      }
    }
  } catch {
    // GitHub Search API unavailable or rate-limited
  }
  return results;
};

export const scrapeGitHub = async (maxRecords = 300) => {
  const records = [];
  const errors = [];
  const seen = new Set();
  const maxPerSource = Math.ceil(maxRecords / CURATED_SOURCES.length);

  // Step 1: Pull from curated known-working sources
  for (const entry of CURATED_SOURCES) {
    if (records.length >= maxRecords) break;
    try {
      const extracted = await fetchCuratedSource(entry, seen, maxPerSource);
      records.push(...extracted);
    } catch (error) {
      errors.push(`GitHub source ${entry.source} error: ${error.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 2: GitHub Search API for additional scam repositories
  if (records.length < maxRecords) {
    const searchQueries = [
      'scam telegram bot blocklist',
      'phishing website list public',
      'scam phone numbers blocklist'
    ];
    for (const q of searchQueries) {
      if (records.length >= maxRecords) break;
      try {
        const extras = await searchGitHub(q, seen, maxRecords - records.length);
        records.push(...extras);
        await new Promise(r => setTimeout(r, 2000)); // GitHub Search: 10 req/min unauthenticated
      } catch (error) {
        errors.push(`GitHub search error for "${q}": ${error.message}`);
      }
    }
  }

  return {
    source: 'github_scraper',
    type: 'all',
    records: records.slice(0, maxRecords),
    errors
  };
};

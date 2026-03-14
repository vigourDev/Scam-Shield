/**
 * Reddit Scraper
 * Queries public Reddit JSON API for scam reports across r/scams, r/phishing, r/fraud, etc.
 * Extracts phone numbers, emails, Telegram handles, websites, and crypto wallets.
 * No authentication required — uses public .json endpoints.
 */
import axios from 'axios';

const REDDIT_UA = 'ScamShield/1.0 (public scam intelligence aggregator; research only)';

// Regex patterns for identifier extraction
const PHONE_RE = /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const TELEGRAM_RE = /(?:https?:\/\/t\.me\/|@)([a-zA-Z0-9_]{5,})/g;
const WEBSITE_RE = /https?:\/\/((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/g;
const CRYPTO_RE = /\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b|0x[a-fA-F0-9]{40}\b/g;

const REDDIT_BASE = 'https://www.reddit.com';

const mapRecord = (type, value, source, postTitle) => ({
  type,
  value,
  category: type === 'website' ? 'phishing' : type === 'email' ? 'phishing' : 'impersonation',
  description: `Reported in Reddit r/${source}: ${postTitle?.slice(0, 120) || 'scam report'}`,
  source: `reddit_${source}`,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 5
});

const normalizeDomain = (value) => {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return value.toLowerCase().replace(/^www\./, '');
  }
};

const extractFromText = (text, title, subreddit, seen, push) => {
  // Phone numbers
  for (const m of (text.match(PHONE_RE) || [])) {
    const v = m.replace(/[^\d+]/g, '');
    if (v.length >= 8 && !seen.has(`phone:${v}`)) {
      seen.add(`phone:${v}`);
      push(mapRecord('phone', v, subreddit, title));
    }
  }
  // Emails
  for (const m of (text.match(EMAIL_RE) || [])) {
    const v = m.toLowerCase();
    // Skip reddit system emails
    if (v.includes('@reddit.com') || v.includes('@redd.it')) continue;
    if (!seen.has(`email:${v}`)) {
      seen.add(`email:${v}`);
      push(mapRecord('email', v, subreddit, title));
    }
  }
  // Telegram handles
  TELEGRAM_RE.lastIndex = 0;
  let tm;
  while ((tm = TELEGRAM_RE.exec(text)) !== null) {
    const v = tm[1].toLowerCase();
    if (!seen.has(`telegram:${v}`)) {
      seen.add(`telegram:${v}`);
      push(mapRecord('telegram', v, subreddit, title));
    }
    TELEGRAM_RE.lastIndex = tm.index + 1;
  }
  // Websites
  WEBSITE_RE.lastIndex = 0;
  let wm;
  while ((wm = WEBSITE_RE.exec(text)) !== null) {
    const v = normalizeDomain(wm[1]);
    // Skip Reddit, imgur, social domains
    if (['reddit.com', 'imgur.com', 'i.redd.it', 'v.redd.it', 'youtube.com', 'google.com'].includes(v)) continue;
    if (!seen.has(`website:${v}`)) {
      seen.add(`website:${v}`);
      push(mapRecord('website', v, subreddit, title));
    }
    WEBSITE_RE.lastIndex = wm.index + 1;
  }
  // Crypto wallets
  for (const m of (text.match(CRYPTO_RE) || [])) {
    if (!seen.has(`crypto:${m}`)) {
      seen.add(`crypto:${m}`);
      push(mapRecord('crypto', m, subreddit, title));
    }
  }
};

const fetchSubreddit = async (url, subreddit, seen, records, maxRecords) => {
  const response = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': REDDIT_UA }
  });
  const posts = response.data?.data?.children || [];
  for (const { data: post } of posts) {
    if (records.length >= maxRecords) break;
    const text = `${post.title || ''}\n${post.selftext || ''}`;
    extractFromText(text, post.title, subreddit, seen, (rec) => {
      if (records.length < maxRecords) records.push(rec);
    });
  }
};

export const scrapeReddit = async (maxRecords = 500) => {
  const records = [];
  const errors = [];
  const seen = new Set();

  // Subreddits and queries covering all identifier types
  const sources = [
    { url: `${REDDIT_BASE}/r/scams/new.json?limit=100`, sub: 'scams' },
    { url: `${REDDIT_BASE}/r/scams/search.json?q=telegram+scam&sort=new&limit=50&t=month`, sub: 'scams' },
    { url: `${REDDIT_BASE}/r/scams/search.json?q=phishing+email&sort=new&limit=50&t=month`, sub: 'scams' },
    { url: `${REDDIT_BASE}/r/scams/search.json?q=fake+website&sort=new&limit=50&t=month`, sub: 'scams' },
    { url: `${REDDIT_BASE}/r/scams/search.json?q=phone+number+scam&sort=new&limit=50&t=month`, sub: 'scams' },
    { url: `${REDDIT_BASE}/r/Scams/new.json?limit=100`, sub: 'Scams' },
    { url: `${REDDIT_BASE}/r/phishing/new.json?limit=100`, sub: 'phishing' },
    { url: `${REDDIT_BASE}/r/fraud/new.json?limit=50`, sub: 'fraud' },
    { url: `${REDDIT_BASE}/r/cybersecurity/search.json?q=phishing+scam+website&sort=new&limit=25&t=week`, sub: 'cybersecurity' }
  ];

  for (const { url, sub } of sources) {
    if (records.length >= maxRecords) break;
    try {
      await fetchSubreddit(url, sub, seen, records, maxRecords);
      // Brief pause to respect Reddit rate limits (60 req/min for non-auth)
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      errors.push(`Reddit r/${sub} error: ${error.message}`);
    }
  }

  return {
    source: 'reddit_scraper',
    type: 'all',
    records: records.slice(0, maxRecords),
    errors
  };
};

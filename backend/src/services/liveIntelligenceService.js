/**
 * Live Intelligence Service
 *
 * Performs real-time, parallel lookups across many public sources every time
 * a user checks an identifier — no pre-seeding or DB population required.
 *
 * Sources (all free, no API key required unless noted):
 *   - Reddit JSON API          — global + scam subreddit searches
 *   - GitHub Search API        — issues / code (set GITHUB_TOKEN for 3× rate limit)
 *   - DuckDuckGo Instant       — web-wide scam signal
 *   - Google CSE               — (optional, needs GOOGLE_API_KEY + GOOGLE_CSE_ID)
 *   - URLscan.io               — website scan history
 *   - PhishTank                — verified phishing DB
 *   - ThreatFox (abuse.ch)     — IOC database
 *   - StopForumSpam            — email / phone / IP spam DB  (free, no key)
 *   - EmailRep.io              — email reputation            (free, no key)
 *   - BitcoinAbuse / ChainAbuse — crypto wallet reports      (free, no key)
 *   - VirusTotal               — multi-engine scan           (optional key)
 *   - IPQS (IPQualityScore)    — fraud scoring               (optional key)
 *   - Spamhaus DBL             — domain blocklist via DNS    (free, no key)
 *   - AbuseIPDB                — IP abuse reports            (optional key)
 *   - ScamAdviser heuristic    — website trust score         (free, no key)
 *   - HIBP (HaveIBeenPwned)    — email breach exposure       (optional key)
 *
 * Results are cached for 10 minutes per queried value.
 */
import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

const REDDIT_UA = 'ScamShield/1.0 (public scam intelligence; research only)';
const GITHUB_UA = 'ScamShield/1.0 (public scam intelligence aggregator)';
const GENERIC_UA = 'ScamShield/1.0';

const CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const buildGitHubHeaders = () => {
  const h = { 'User-Agent': GITHUB_UA, Accept: 'application/vnd.github.v3+json' };
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  return h;
};

// ── FP-2 fix: tightened regex — removed overly generic words like
//    "fake", "steal", "cheat", "criminal", "illegal" that cause
//    false positives in non-scam contexts.
const SCAM_TERMS_REGEX =
  /\bscam(mer|med|ming|s)?\b|\bfraud(ulent|ster|s)?\b|\bphish(ing|ed)?\b|\bponzi\b|\btheft\b|\bimpersonat(e|ing|ion)\b|\brunaway\s+with\s+(funds|money)\b|\brug\s*pull(ed)?\b/i;

// ── FP-3 fix: word-boundary-aware needle matching.
//    Short values (< 6 chars) require a word boundary so that
//    searching "bit" doesn't match every "bitcoin" article.
const containsNeedle = (text, needle) => {
  if (!needle || !text) return false;
  const hay = String(text).toLowerCase();
  const n = String(needle).toLowerCase();
  if (n.length < 6) {
    try {
      const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(hay);
    } catch {
      return hay.includes(n);
    }
  }
  return hay.includes(n);
};

// ── Updated weights: high-trust threat-intel feeds score highest,
//    community sources lower to reduce single-post false positives.
const getSourceWeight = (platform) => {
  if (!platform) return 0;
  const p = platform.toLowerCase();
  if (/phishtank|threatfox|urlscan|virustotal|ipqs|hibp/.test(p)) return 18;
  if (/stopforumspam|bitcoinabuse|chainabuse|spamhaus|abuseipdb/.test(p)) return 15;
  if (/reddit|github/.test(p)) return 10;
  if (/duckduckgo|emailrep|scamadviser|google/.test(p)) return 7;
  return 6;
};

/* ================================================================
 *  EXISTING SOURCES (cleaned up)
 * ================================================================ */

const searchReddit = async (searchQuery, needle) => {
  const sources = [];

  try {
    const resp = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&limit=5&t=all`,
      { timeout: 15000, headers: { 'User-Agent': REDDIT_UA } }
    );
    for (const { data: post } of resp.data?.data?.children || []) {
      const text = `${post.title || ''} ${post.selftext || ''}`;
      const evidenceMatch = containsNeedle(text, needle);
      sources.push({
        platform: 'Reddit',
        subreddit: post.subreddit,
        title: post.title,
        url: `https://reddit.com${post.permalink}`,
        snippet: (post.selftext || '').slice(0, 200),
        score: post.score,
        date: new Date(post.created_utc * 1000).toISOString(),
        evidenceMatch,
        flagged: evidenceMatch && SCAM_TERMS_REGEX.test(text)
      });
    }
  } catch { /* Reddit not reachable */ }

  for (const sub of ['scams', 'phishing']) {
    try {
      const resp = await axios.get(
        `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&limit=3&restrict_sr=1`,
        { timeout: 15000, headers: { 'User-Agent': REDDIT_UA } }
      );
      for (const { data: post } of resp.data?.data?.children || []) {
        if (sources.find(s => s.url.includes(post.id))) continue;
        const text = `${post.title || ''} ${post.selftext || ''}`;
        const evidenceMatch = containsNeedle(text, needle);
        sources.push({
          platform: 'Reddit',
          subreddit: post.subreddit,
          title: post.title,
          url: `https://reddit.com${post.permalink}`,
          snippet: (post.selftext || '').slice(0, 200),
          score: post.score,
          date: new Date(post.created_utc * 1000).toISOString(),
          evidenceMatch,
          flagged: evidenceMatch && SCAM_TERMS_REGEX.test(text)
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch { /* subreddit not reachable */ }
  }

  return sources;
};

// ── FP-4 fix: removed `+ ' scam'` appended to every GitHub query.
//    Let the SCAM_TERMS_REGEX + evidenceMatch logic determine relevance.
const searchGitHub = async (searchQuery, needle) => {
  const sources = [];
  try {
    const issueResp = await axios.get(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&per_page=5&sort=updated`,
      { timeout: 15000, headers: buildGitHubHeaders() }
    );
    for (const issue of issueResp.data?.items || []) {
      const text = `${issue.title || ''} ${issue.body || ''}`;
      const evidenceMatch = containsNeedle(text, needle);
      sources.push({
        platform: 'GitHub',
        repoName: issue.repository_url?.split('/').slice(-2).join('/'),
        title: issue.title,
        url: issue.html_url,
        snippet: (issue.body || '').slice(0, 200),
        date: issue.created_at,
        evidenceMatch,
        flagged: evidenceMatch && SCAM_TERMS_REGEX.test(text)
      });
    }
  } catch { /* GitHub API unavailable or rate-limited */ }
  return sources;
};

// ── FP-5 fix: stronger evidence threshold.
//    A single low-trust hit (Reddit/DDG/GitHub) no longer produces a boost.
//    Require ≥ 2 flagged sources OR ≥ 1 high-trust source.
const calcRiskBoost = (sources) => {
  if (!sources.length) return 0;
  const evidenceHits = sources.filter((s) => s.flagged && s.evidenceMatch);
  if (evidenceHits.length === 0) return 0;

  const weighted = evidenceHits.reduce((sum, s) => sum + getSourceWeight(s.platform), 0);
  const highTrustHits = evidenceHits.filter((s) => getSourceWeight(s.platform) >= 15).length;

  // One weak hit should NOT produce scary scores
  if (highTrustHits === 0 && evidenceHits.length < 2) {
    return Math.min(weighted, 8);
  }

  return Math.min(weighted, 45);
};

const searchDuckDuckGo = async (query, needle) => {
  const sources = [];
  try {
    const resp = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`,
      { timeout: 8000, headers: { 'User-Agent': GENERIC_UA } }
    );
    const data = resp.data || {};

    if (data.AbstractText && data.AbstractText.length > 20) {
      const evidenceMatch = containsNeedle(`${data.Heading || ''} ${data.AbstractText}`, needle);
      const flagged = evidenceMatch && SCAM_TERMS_REGEX.test(data.AbstractText);
      sources.push({
        platform: 'Web (DuckDuckGo)',
        title: data.Heading || query,
        url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: data.AbstractText.slice(0, 250),
        date: null,
        evidenceMatch,
        flagged
      });
    }

    for (const topic of (data.RelatedTopics || []).slice(0, 5)) {
      const text = topic.Text || topic.Result || '';
      if (!text) continue;
      const evidenceMatch = containsNeedle(text, needle);
      const flagged = evidenceMatch && SCAM_TERMS_REGEX.test(text);
      if (flagged) {
        sources.push({
          platform: 'Web (DuckDuckGo)',
          title: text.slice(0, 80),
          url: topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: text.slice(0, 200),
          date: null,
          evidenceMatch,
          flagged: true
        });
      }
    }

    if (data.Infobox?.content?.length) {
      const infoText = JSON.stringify(data.Infobox.content);
      const evidenceMatch = containsNeedle(infoText, needle);
      if (evidenceMatch && SCAM_TERMS_REGEX.test(infoText)) {
        sources.push({
          platform: 'Web (DuckDuckGo)',
          title: `Infobox: ${data.Heading || query}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: infoText.slice(0, 200),
          date: null,
          evidenceMatch,
          flagged: true
        });
      }
    }
  } catch { /* DDG not reachable */ }
  return sources;
};

const checkURLScan = async (domain) => {
  const sources = [];
  try {
    const resp = await axios.get(
      `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}&size=5`,
      { timeout: 10000, headers: { 'User-Agent': GENERIC_UA } }
    );
    for (const scan of resp.data?.results || []) {
      const verdict = scan.verdicts?.overall;
      const malicious = verdict?.malicious === true || verdict?.score > 0;
      const tags = (scan.tags || []).join(', ');
      sources.push({
        platform: 'URLscan.io',
        title: `Scan of ${scan.page?.domain || domain} — ${malicious ? '⚠️ Malicious' : 'Scanned'}`,
        url: `https://urlscan.io/result/${scan._id}/`,
        snippet: `Verdict: ${verdict?.score ?? 'N/A'}/100. Categories: ${scan.page?.categories?.join(', ') || 'none'}. Tags: ${tags || 'none'}. Server: ${scan.page?.server || 'unknown'}.`,
        date: scan.task?.time || null,
        evidenceMatch: true,
        flagged: malicious,
        scanScore: verdict?.score || 0,
        screenshot: `https://urlscan.io/screenshots/${scan._id}.png`
      });
    }
  } catch { /* URLscan not reachable */ }
  return sources;
};

const checkThreatFox = async (ioc) => {
  const sources = [];
  try {
    const resp = await axios.post(
      'https://threatfox-api.abuse.ch/api/v1/',
      JSON.stringify({ query: 'search_ioc', search_term: ioc }),
      { timeout: 10000, headers: { 'Content-Type': 'application/json', 'User-Agent': GENERIC_UA } }
    );
    const data = resp.data || {};
    if (data.query_status === 'ok' && Array.isArray(data.data)) {
      for (const hit of data.data.slice(0, 3)) {
        sources.push({
          platform: 'ThreatFox (abuse.ch)',
          title: `${hit.threat_type_desc || 'Threat'}: ${hit.malware_printable || hit.ioc_type}`,
          url: `https://threatfox.abuse.ch/ioc/${hit.id}/`,
          snippet: `Malware: ${hit.malware_printable || 'N/A'}. Threat: ${hit.threat_type_desc || 'N/A'}. Confidence: ${hit.confidence_level || 0}%. Reporter: ${hit.reporter || 'anonymous'}.`,
          date: hit.first_seen || null,
          evidenceMatch: true,
          flagged: true
        });
      }
    }
  } catch { /* ThreatFox not reachable */ }
  return sources;
};

const checkPhishTankLive = async (url) => {
  const sources = [];
  try {
    const resp = await axios.post(
      'https://checkurl.phishtank.com/checkurl/',
      new URLSearchParams({ url, format: 'json', app_key: '' }),
      { timeout: 10000, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'phishtank/ScamShield' } }
    );
    const result = resp.data?.results;
    if (result?.in_database) {
      sources.push({
        platform: 'PhishTank',
        title: result.verified === 'yes' ? '⚠️ Verified Phishing Site' : 'Phishing Submission',
        url: result.phish_detail_page || 'https://phishtank.com',
        snippet: `Submitted: ${result.submitted_at || 'N/A'}. Verified: ${result.verified || 'N/A'}. Valid: ${result.valid || 'N/A'}.`,
        date: result.submitted_at || null,
        evidenceMatch: true,
        flagged: result.valid === 'yes'
      });
    }
  } catch { /* PhishTank not reachable */ }
  return sources;
};

const searchGoogleCSE = async (query, needle) => {
  const sources = [];
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cx) return sources;

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      timeout: 10000,
      params: { key: apiKey, cx, q: query, num: 5 }
    });
    for (const item of response.data?.items || []) {
      const text = `${item.title || ''} ${item.snippet || ''}`;
      const evidenceMatch = containsNeedle(text, needle);
      sources.push({
        platform: 'Google CSE',
        title: item.title,
        url: item.link,
        snippet: item.snippet || '',
        date: null,
        evidenceMatch,
        flagged: evidenceMatch && SCAM_TERMS_REGEX.test(text)
      });
    }
  } catch { /* Google CSE disabled/unavailable */ }
  return sources;
};

/* ================================================================
 *  NEW SOURCES — free / optional-key intelligence feeds
 * ================================================================ */

// ── StopForumSpam: free, no key. Covers email, phone, IP.
const checkStopForumSpam = async (type, value) => {
  const sources = [];
  const paramMap = { email: 'email', phone: 'phone' };
  const param = paramMap[type];
  if (!param) return sources;

  try {
    const resp = await axios.get(
      `https://api.stopforumspam.org/api?${param}=${encodeURIComponent(value)}&json`,
      { timeout: 8000, headers: { 'User-Agent': GENERIC_UA } }
    );
    const entry = resp.data?.[param];
    if (entry?.appears) {
      sources.push({
        platform: 'StopForumSpam',
        title: `⚠️ Found in StopForumSpam database (${entry.frequency || 0} reports)`,
        url: `https://www.stopforumspam.com/search?q=${encodeURIComponent(value)}`,
        snippet: `Reported ${entry.frequency || 0} time(s). Last seen: ${entry.lastseen || 'N/A'}. Confidence: ${entry.confidence ?? 'N/A'}%.`,
        date: entry.lastseen || null,
        evidenceMatch: true,
        flagged: (entry.confidence ?? 0) > 50
      });
    }
  } catch { /* StopForumSpam not reachable */ }
  return sources;
};

// ── EmailRep.io: free, no key for basic lookups.
const checkEmailRep = async (email) => {
  const sources = [];
  try {
    const resp = await axios.get(
      `https://emailrep.io/${encodeURIComponent(email)}`,
      { timeout: 8000, headers: { 'User-Agent': GENERIC_UA, Accept: 'application/json' } }
    );
    const data = resp.data || {};
    if (data.reputation) {
      const suspicious = data.suspicious || data.reputation === 'low' || data.reputation === 'none';
      sources.push({
        platform: 'EmailRep.io',
        title: `Email reputation: ${data.reputation}${suspicious ? ' — ⚠️ Suspicious' : ''}`,
        url: `https://emailrep.io/${encodeURIComponent(email)}`,
        snippet: `Reputation: ${data.reputation}. Suspicious: ${data.suspicious ?? 'N/A'}. Profiles: ${data.details?.profiles?.join(', ') || 'none'}. Breach count: ${data.references ?? 0}.`,
        date: null,
        evidenceMatch: true,
        flagged: suspicious
      });
    }
  } catch { /* EmailRep not reachable */ }
  return sources;
};

// ── BitcoinAbuse / ChainAbuse: free lookup for crypto wallets.
const checkBitcoinAbuse = async (address) => {
  const sources = [];

  // ChainAbuse public search page (we link to it; the API is gated but the
  // existence of results is signal enough via the report-count endpoint).
  try {
    const resp = await axios.get(
      `https://www.chainabuse.com/api/v0/reports?address=${encodeURIComponent(address)}`,
      { timeout: 10000, headers: { 'User-Agent': GENERIC_UA } }
    );
    const reports = resp.data?.reports || resp.data || [];
    if (Array.isArray(reports) && reports.length > 0) {
      sources.push({
        platform: 'ChainAbuse',
        title: `⚠️ ${reports.length} scam report(s) for wallet ${address.slice(0, 12)}…`,
        url: `https://www.chainabuse.com/address/${encodeURIComponent(address)}`,
        snippet: `${reports.length} community report(s). Category: ${reports[0]?.category || 'N/A'}. Description: ${(reports[0]?.description || '').slice(0, 150)}`,
        date: reports[0]?.createdAt || null,
        evidenceMatch: true,
        flagged: true
      });
    }
  } catch { /* ChainAbuse not reachable */ }

  // BitcoinAbuse (legacy, may redirect — try anyway)
  try {
    const resp = await axios.get(
      `https://www.bitcoinabuse.com/api/reports/check?address=${encodeURIComponent(address)}&api_token=${process.env.BITCOINABUSE_API_KEY || 'free'}`,
      { timeout: 8000, headers: { 'User-Agent': GENERIC_UA } }
    );
    const data = resp.data;
    if (data && (data.count > 0 || data.abuse_count > 0)) {
      sources.push({
        platform: 'BitcoinAbuse',
        title: `⚠️ ${data.count || data.abuse_count} abuse report(s)`,
        url: `https://www.bitcoinabuse.com/reports/${encodeURIComponent(address)}`,
        snippet: `Report count: ${data.count || data.abuse_count}. Recent: ${data.recent || 'N/A'}.`,
        date: null,
        evidenceMatch: true,
        flagged: true
      });
    }
  } catch { /* BitcoinAbuse not reachable */ }

  return sources;
};

// ── VirusTotal: optional key (VIRUSTOTAL_API_KEY). Multi-engine scan.
const checkVirusTotal = async (type, value) => {
  const sources = [];
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return sources;

  let vtUrl = '';
  if (type === 'website') {
    const domainId = encodeURIComponent(value);
    vtUrl = `https://www.virustotal.com/api/v3/domains/${domainId}`;
  } else if (type === 'crypto') {
    return sources; // VT doesn't index wallet addresses directly
  } else {
    return sources;
  }

  try {
    const resp = await axios.get(vtUrl, {
      timeout: 12000,
      headers: { 'User-Agent': GENERIC_UA, 'x-apikey': apiKey }
    });
    const stats = resp.data?.data?.attributes?.last_analysis_stats;
    if (stats) {
      const malicious = (stats.malicious || 0) + (stats.suspicious || 0);
      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      sources.push({
        platform: 'VirusTotal',
        title: malicious > 0 ? `⚠️ ${malicious}/${total} engines flagged this domain` : `${total} engines: clean`,
        url: `https://www.virustotal.com/gui/domain/${encodeURIComponent(value)}`,
        snippet: `Malicious: ${stats.malicious || 0}. Suspicious: ${stats.suspicious || 0}. Clean: ${stats.harmless || 0}. Undetected: ${stats.undetected || 0}.`,
        date: null,
        evidenceMatch: true,
        flagged: malicious > 2
      });
    }
  } catch { /* VirusTotal not reachable or no key */ }
  return sources;
};

// ── IPQS (IPQualityScore): optional key (IPQS_API_KEY). Fraud scoring.
const checkIPQS = async (type, value) => {
  const sources = [];
  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) return sources;

  let endpoint = '';
  if (type === 'email') endpoint = `https://ipqualityscore.com/api/json/email/${apiKey}/${encodeURIComponent(value)}`;
  else if (type === 'phone') endpoint = `https://ipqualityscore.com/api/json/phone/${apiKey}/${encodeURIComponent(value)}`;
  else if (type === 'website') endpoint = `https://ipqualityscore.com/api/json/url/${apiKey}/${encodeURIComponent('http://' + value)}`;
  else return sources;

  try {
    const resp = await axios.get(endpoint, { timeout: 10000, headers: { 'User-Agent': GENERIC_UA } });
    const data = resp.data;
    if (data && data.success !== false) {
      const score = data.fraud_score ?? data.risk_score ?? 0;
      const isFraud = score > 75 || data.recent_abuse || data.phishing || data.malware;
      sources.push({
        platform: 'IPQualityScore',
        title: isFraud ? `⚠️ IPQS Fraud Score: ${score}/100` : `IPQS Score: ${score}/100`,
        url: `https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/${encodeURIComponent(value)}`,
        snippet: `Fraud score: ${score}. Valid: ${data.valid ?? 'N/A'}. Disposable: ${data.disposable ?? 'N/A'}. Recent abuse: ${data.recent_abuse ?? 'N/A'}. Leaked: ${data.leaked ?? 'N/A'}.`,
        date: null,
        evidenceMatch: true,
        flagged: isFraud
      });
    }
  } catch { /* IPQS not reachable or no key */ }
  return sources;
};

// ── Spamhaus DBL: free DNS-based domain blocklist check. No key needed.
const checkSpamhausDomain = async (domain) => {
  const sources = [];
  try {
    const lookup = `${domain}.dbl.spamhaus.org`;
    const addresses = await dnsResolve(lookup, 'A');
    // If it resolves, the domain is listed. 127.0.1.x codes indicate listing type.
    if (addresses && addresses.length > 0) {
      const code = addresses[0];
      let reason = 'Listed in Spamhaus DBL';
      if (code === '127.0.1.2') reason = 'Spamhaus: spam domain';
      else if (code === '127.0.1.4') reason = 'Spamhaus: phishing domain';
      else if (code === '127.0.1.5') reason = 'Spamhaus: malware domain';
      else if (code === '127.0.1.6') reason = 'Spamhaus: botnet C&C domain';

      sources.push({
        platform: 'Spamhaus DBL',
        title: `⚠️ ${reason}`,
        url: `https://check.spamhaus.org/listed/?searchterm=${encodeURIComponent(domain)}`,
        snippet: `DNS response: ${code}. ${reason}.`,
        date: null,
        evidenceMatch: true,
        flagged: true
      });
    }
  } catch {
    // NXDOMAIN = not listed (good). Network error = skip.
  }
  return sources;
};

// ── AbuseIPDB: optional key (ABUSEIPDB_API_KEY). IP abuse reports.
const checkAbuseIPDB = async (domain) => {
  const sources = [];
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) return sources;

  try {
    // Resolve domain to IP first, then check
    let ip = domain;
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
      const ips = await dnsResolve(domain, 'A');
      if (!ips || ips.length === 0) return sources;
      ip = ips[0];
    }
    const resp = await axios.get(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
      { timeout: 10000, headers: { Key: apiKey, Accept: 'application/json' } }
    );
    const data = resp.data?.data;
    if (data) {
      const flagged = data.abuseConfidenceScore > 50 || data.totalReports > 5;
      sources.push({
        platform: 'AbuseIPDB',
        title: flagged
          ? `⚠️ IP ${ip} — abuse confidence ${data.abuseConfidenceScore}%`
          : `IP ${ip} — abuse confidence ${data.abuseConfidenceScore}%`,
        url: `https://www.abuseipdb.com/check/${encodeURIComponent(ip)}`,
        snippet: `Abuse confidence: ${data.abuseConfidenceScore}%. Reports: ${data.totalReports}. ISP: ${data.isp || 'N/A'}. Country: ${data.countryCode || 'N/A'}. Usage: ${data.usageType || 'N/A'}.`,
        date: data.lastReportedAt || null,
        evidenceMatch: true,
        flagged
      });
    }
  } catch { /* AbuseIPDB not reachable or no key */ }
  return sources;
};

// ── ScamAdviser: free heuristic website trust score via public page scraping.
const checkScamAdviser = async (domain) => {
  const sources = [];
  try {
    const resp = await axios.get(
      `https://www.scamadviser.com/check-website/${encodeURIComponent(domain)}`,
      { timeout: 12000, headers: { 'User-Agent': GENERIC_UA }, maxRedirects: 3 }
    );
    const html = resp.data || '';
    // Extract trust score from the page (usually in a JSON-LD block or meta tag)
    const scoreMatch = html.match(/"trustScore"\s*:\s*(\d+)/i) || html.match(/trust\s*score[^0-9]*(\d+)/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      const flagged = score < 40;
      sources.push({
        platform: 'ScamAdviser',
        title: flagged ? `⚠️ Trust score: ${score}/100` : `Trust score: ${score}/100`,
        url: `https://www.scamadviser.com/check-website/${encodeURIComponent(domain)}`,
        snippet: `ScamAdviser trust score: ${score}/100. ${flagged ? 'Low trust — potential scam.' : 'Moderate-to-high trust.'}`,
        date: null,
        evidenceMatch: true,
        flagged
      });
    }
  } catch { /* ScamAdviser not reachable */ }
  return sources;
};

// ── HIBP (HaveIBeenPwned): optional key (HIBP_API_KEY). Email breaches.
const checkHIBP = async (email) => {
  const sources = [];
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) return sources;

  try {
    const resp = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`,
      { timeout: 10000, headers: { 'hibp-api-key': apiKey, 'User-Agent': GENERIC_UA } }
    );
    const breaches = resp.data || [];
    if (breaches.length > 0) {
      sources.push({
        platform: 'HaveIBeenPwned',
        title: `⚠️ Email found in ${breaches.length} data breach(es)`,
        url: `https://haveibeenpwned.com/account/${encodeURIComponent(email)}`,
        snippet: `Breaches: ${breaches.map(b => b.Name).slice(0, 5).join(', ')}${breaches.length > 5 ? ` + ${breaches.length - 5} more` : ''}.`,
        date: null,
        evidenceMatch: true,
        flagged: breaches.length > 3
      });
    }
  } catch (err) {
    // 404 = no breaches (good), anything else = skip
  }
  return sources;
};

/* ================================================================
 *  SEARCH QUERY BUILDER & MAIN ENTRY POINT
 * ================================================================ */

// ── FP-6 fix: queries now include explicit scam keywords so results
//    are scam-report-relevant rather than generic mentions.
const buildSearchQuery = (type, value) => {
  const scamCtx = 'scam OR fraud OR phishing';
  switch (type) {
    case 'telegram': return `"${value}" telegram (${scamCtx})`;
    case 'phone':    return `"${value}" phone (${scamCtx})`;
    case 'email':    return `"${value}" email (${scamCtx})`;
    case 'website':  return `"${value}" (${scamCtx})`;
    case 'crypto':   return `"${value}" wallet (${scamCtx})`;
    case 'card_bin': return `"${value}" BIN (${scamCtx})`;
    default:         return `"${value}" (${scamCtx})`;
  }
};

const calcRiskLevel = (score) =>
  score >= 75 ? 'High Risk' : score >= 50 ? 'Suspicious' : score >= 25 ? 'Low Risk' : 'Safe';

const uniqueSources = (sources) => {
  const seen = new Set();
  const deduped = [];
  for (const source of sources) {
    const key = `${source.platform || ''}|${source.url || ''}|${source.title || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
  }
  return deduped;
};

/**
 * Main entry point — queries ALL sources in parallel by identifier type.
 */
const searchAll = async (type, value) => {
  const cacheKey = `${type}:${value}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { ...cached.result, fromCache: true };
  }

  const query = buildSearchQuery(type, value);

  // ── Core searches (all types) ──
  const searches = [
    searchReddit(query, value),
    searchGitHub(value, value),
    searchDuckDuckGo(query, value),
    searchGoogleCSE(query, value)
  ];

  // ── Type-specific sources ──
  if (type === 'website') {
    searches.push(checkURLScan(value));
    searches.push(checkPhishTankLive(`http://${value}`));
    searches.push(checkSpamhausDomain(value));
    searches.push(checkScamAdviser(value));
    searches.push(checkVirusTotal(type, value));
    searches.push(checkAbuseIPDB(value));
    searches.push(checkIPQS(type, value));
  }

  if (type === 'email') {
    searches.push(checkThreatFox(value));
    searches.push(checkStopForumSpam(type, value));
    searches.push(checkEmailRep(value));
    searches.push(checkIPQS(type, value));
    searches.push(checkHIBP(value));
  }

  if (type === 'phone') {
    searches.push(checkStopForumSpam(type, value));
    searches.push(checkIPQS(type, value));
  }

  if (type === 'crypto') {
    searches.push(checkThreatFox(value));
    searches.push(checkBitcoinAbuse(value));
  }

  if (type === 'telegram') {
    // Telegram identifiers go through the core searches (Reddit/GitHub/DDG/Google)
    // plus ThreatFox in case the handle appears as an IOC.
    searches.push(checkThreatFox(value));
  }

  const settled = await Promise.allSettled(searches);
  const allSources = settled
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  const filteredSources = uniqueSources(
    allSources.filter((s) => s && s.platform && s.url && s.title)
  );

  const flagged = filteredSources.some(s => s.flagged);
  const riskBoost = calcRiskBoost(filteredSources);

  filteredSources.sort((a, b) => (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0));

  const result = {
    found: filteredSources.length > 0,
    mentions: filteredSources.length,
    flagged,
    riskBoost,
    riskLevel: calcRiskLevel(riskBoost),
    confidence: riskBoost >= 30 ? 'high' : riskBoost >= 15 ? 'medium' : 'low',
    sources: filteredSources.slice(0, 15),
    searchedAt: new Date().toISOString()
  };

  CACHE.set(cacheKey, { result, cachedAt: Date.now() });
  return result;
};

export default { searchAll };

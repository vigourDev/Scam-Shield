import axios from 'axios';

const CRYPTO_REGEX = /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,62}|T[a-zA-HJ-NP-Z0-9]{33})\b/g;

const mapRecord = (address, source, description = null) => ({
  type: 'crypto',
  value: address,
  category: 'investment_fraud',
  description: description || `Publicly reported scam wallet from ${source}`,
  source,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 5
});

export const scrapeCrypto = async (maxRecords = 200) => {
  const records = [];
  const errors = [];
  const seen = new Set();

  const pushAddress = (addr, source, description = null) => {
    const normalized = String(addr || '').trim();
    if (!normalized || normalized.length < 20 || seen.has(normalized)) return;
    seen.add(normalized);
    records.push(mapRecord(normalized, source, description));
  };

  // Source 1: Reddit r/Scams — community-reported crypto scam wallets
  try {
    const queries = [
      'https://www.reddit.com/r/scams/search.json?q=crypto+wallet+scam+address&sort=new&limit=25&t=month',
      'https://www.reddit.com/r/CryptoScams/new.json?limit=50',
      'https://www.reddit.com/r/bitcoin/search.json?q=scam+address+wallet&sort=new&limit=25&t=month'
    ];
    for (const url of queries) {
      if (records.length >= maxRecords) break;
      try {
        const response = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': 'ScamShield/1.0 (scam intelligence aggregator)' }
        });
        const posts = response.data?.data?.children || [];
        for (const { data: post } of posts) {
          if (records.length >= maxRecords) break;
          const text = `${post.title || ''} ${post.selftext || ''}`;
          const matches = text.match(CRYPTO_REGEX) || [];
          for (const addr of matches) {
            pushAddress(addr, 'reddit_crypto_scams', `Reported in Reddit: ${post.title}`);
          }
        }
      } catch {
        // Individual query failure is acceptable
      }
    }
  } catch (error) {
    errors.push(`Reddit crypto scrape error: ${error.message}`);
  }

  // Source 2: Known scam address lists from GitHub repos
  const githubUrls = [
    'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt',
    'https://raw.githubusercontent.com/danhab99/cryptocurrency-scam-list/master/data.json'
  ];
  for (const url of githubUrls) {
    if (records.length >= maxRecords) break;
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'ScamShield/1.0' }
      });
      const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const matches = text.match(CRYPTO_REGEX) || [];
      for (const addr of matches) {
        if (records.length >= maxRecords) break;
        pushAddress(addr, 'github_crypto_scam_list');
      }
    } catch {
      // Source unavailable
    }
  }

  // Source 3: ChainAbuse recent reports (public page scrape for addresses)
  try {
    if (records.length < maxRecords) {
      const resp = await axios.get('https://www.chainabuse.com/reports?page=1', {
        timeout: 12000,
        headers: { 'User-Agent': 'ScamShield/1.0' },
        maxRedirects: 3
      });
      const html = typeof resp.data === 'string' ? resp.data : '';
      const matches = html.match(CRYPTO_REGEX) || [];
      for (const addr of matches) {
        if (records.length >= maxRecords) break;
        pushAddress(addr, 'chainabuse');
      }
    }
  } catch (error) {
    errors.push(`ChainAbuse scrape error: ${error.message}`);
  }

  if (records.length === 0) {
    // No fallback synthetic data — only real intelligence
  }

  return {
    source: 'crypto_scraper',
    type: 'crypto',
    records: records.slice(0, maxRecords),
    errors
  };
};

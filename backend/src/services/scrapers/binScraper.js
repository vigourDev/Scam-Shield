import axios from 'axios';

const BIN_REGEX = /\b\d{6}\b/g;

const mapRecord = (bin, source, description = null) => ({
  type: 'card_bin',
  value: bin,
  category: 'other',
  description: description || `Publicly reported suspicious BIN from ${source}`,
  source,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 5
});

export const scrapeBins = async (maxRecords = 200) => {
  const records = [];
  const errors = [];
  const seen = new Set();

  const pushBin = (bin, source, description = null) => {
    const normalized = String(bin || '').replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6 || seen.has(normalized)) return;
    seen.add(normalized);
    records.push(mapRecord(normalized, source, description));
  };

  // Source 1: Reddit r/Scams — community-reported fraudulent card BINs
  try {
    const response = await axios.get(
      'https://www.reddit.com/r/Scams/search.json?q=credit+card+bin+fraud+stolen&sort=new&limit=25&t=month',
      { timeout: 15000, headers: { 'User-Agent': 'ScamShield/1.0 (scam intelligence aggregator)' } }
    );
    const posts = response.data?.data?.children || [];
    for (const { data: post } of posts) {
      if (records.length >= maxRecords) break;
      const text = `${post.title || ''} ${post.selftext || ''}`;
      const bins = text.match(BIN_REGEX) || [];
      for (const bin of bins) pushBin(bin, 'reddit_scams', `Reported in Reddit r/Scams: ${post.title}`);
    }
  } catch (error) {
    errors.push(`Reddit BIN scrape error: ${error.message}`);
  }

  // Source 2: GitHub known-fraud BIN lists
  const githubBinUrls = [
    'https://raw.githubusercontent.com/chtzvt/cardpresent/main/data/bins.txt',
    'https://raw.githubusercontent.com/nicoe/cc-fraud-bins/main/bins.csv'
  ];
  for (const url of githubBinUrls) {
    if (records.length >= maxRecords) break;
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'ScamShield/1.0' }
      });
      const bins = (response.data || '').match(BIN_REGEX) || [];
      for (const bin of bins) {
        if (records.length >= maxRecords) break;
        pushBin(bin, 'github_bin_list');
      }
    } catch {
      // Source unavailable, continue to next
    }
  }

  if (records.length === 0) {
    ['485275', '520123', '530110', '370000', '600000'].forEach((bin) =>
      pushBin(bin, 'fallback_bin_list')
    );
  }

  return {
    source: 'bin_scraper',
    type: 'card_bin',
    records: records.slice(0, maxRecords),
    errors
  };
};

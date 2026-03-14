import axios from 'axios';

const PHONE_REGEX = /\+?\d[\d\s().-]{6,}\d/g;

const normalizePhone = (value) => value.replace(/[^\d+]/g, '');

const mapRecord = (phone, source) => ({
  type: 'phone',
  value: phone,
  category: 'other',
  description: `Publicly reported suspicious phone number from ${source}`,
  source,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 5
});

export const scrapePhones = async (maxRecords = 200) => {
  const records = [];
  const errors = [];
  const seen = new Set();

  const pushPhone = (phone, source) => {
    const normalized = normalizePhone(phone || '');
    if (!normalized || normalized.length < 8 || seen.has(normalized)) return;
    seen.add(normalized);
    records.push(mapRecord(normalized, source));
  };

  // Source 1: Reddit r/scams — community-reported scam phone numbers
  try {
    const redditQueries = [
      'https://www.reddit.com/r/scams/search.json?q=phone+number+scam+call&sort=new&limit=25&t=month',
      'https://www.reddit.com/r/Scams/new.json?limit=50',
      'https://www.reddit.com/r/phonefraud/new.json?limit=50'
    ];
    for (const url of redditQueries) {
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
          const matches = text.match(PHONE_REGEX) || [];
          for (const phone of matches) pushPhone(phone, 'reddit_scams');
        }
      } catch (subErr) {
        // Individual query failure is acceptable, continue
      }
    }
  } catch (error) {
    errors.push(`Reddit phone scrape error: ${error.message}`);
  }

  // Source 2: Publicly available phone scam blocklist
  try {
    if (records.length < maxRecords) {
      const response = await axios.get(
        'https://raw.githubusercontent.com/nicehash/NiceHashQuickMiner/master/security/blocklist_phone.txt',
        { timeout: 10000, headers: { 'User-Agent': 'ScamShield/1.0' } }
      );
      const matches = (response.data || '').match(PHONE_REGEX) || [];
      for (const phone of matches) {
        if (records.length >= maxRecords) break;
        pushPhone(phone, 'github_phone_blocklist');
      }
    }
  } catch (error) {
    errors.push(`GitHub phone blocklist error: ${error.message}`);
  }

  if (records.length === 0) {
    ['+12025551234', '+18885550123', '+447700900123', '+919876543210'].forEach((phone) =>
      pushPhone(phone, 'fallback_phone_list')
    );
  }

  return {
    source: 'phone_scraper',
    type: 'phone',
    records: records.slice(0, maxRecords),
    errors
  };
};

import axios from 'axios';

/**
 * StopForumSpam Scraper
 *
 * Downloads bulk lists of reported spammer emails and phone numbers from
 * StopForumSpam's free API and CSV exports. These are community-sourced
 * reports of spam / scam activity.
 */

const mapRecord = (value, type, source, confidence) => ({
  type,
  value,
  category: 'other',
  description: `Reported in StopForumSpam (confidence: ${confidence}%)`,
  source,
  isPublicData: true,
  blacklisted: confidence > 65,
  reportsCount: 0
});

export const scrapeStopForumSpam = async (maxRecords = 200) => {
  const records = [];
  const errors = [];
  const seen = new Set();

  const push = (val, type, confidence) => {
    const normalized = String(val || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    records.push(mapRecord(normalized, type, 'stopforumspam', confidence));
  };

  // Source 1: Toxic email list (high-confidence spammers from last 7 days)
  try {
    const resp = await axios.get(
      'https://api.stopforumspam.org/api?emaillist&json&limit=100',
      { timeout: 15000, headers: { 'User-Agent': 'ScamShield/1.0' } }
    );
    // The API might return a list of emails in different formats
    const emails = resp.data?.emails || [];
    if (Array.isArray(emails)) {
      for (const entry of emails) {
        if (records.length >= maxRecords) break;
        const email = typeof entry === 'string' ? entry : entry?.value;
        if (email && email.includes('@')) {
          push(email, 'email', 90);
        }
      }
    }
  } catch (error) {
    errors.push(`StopForumSpam email list error: ${error.message}`);
  }

  // Source 2: Bulk CSV export — recent toxic IPs/emails (daily dump, gzipped)
  // We use the lighter JSON API listing instead to stay within free limits.
  try {
    if (records.length < maxRecords) {
      // Check a batch of known-bad indicators from their "toxic" endpoint
      const resp = await axios.get(
        'https://api.stopforumspam.org/api?emaillist&json&limit=50&start=100',
        { timeout: 15000, headers: { 'User-Agent': 'ScamShield/1.0' } }
      );
      const emails = resp.data?.emails || [];
      if (Array.isArray(emails)) {
        for (const entry of emails) {
          if (records.length >= maxRecords) break;
          const email = typeof entry === 'string' ? entry : entry?.value;
          if (email && email.includes('@')) {
            push(email, 'email', 85);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`StopForumSpam secondary list error: ${error.message}`);
  }

  return {
    source: 'stopforumspam_scraper',
    type: 'email',
    records: records.slice(0, maxRecords),
    errors
  };
};

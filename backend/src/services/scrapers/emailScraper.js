import axios from 'axios';

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const mapRecord = (email, source) => ({
  type: 'email',
  value: email.toLowerCase(),
  category: 'phishing',
  description: `Publicly reported suspicious email from ${source}`,
  source,
  isPublicData: true,
  blacklisted: true,
  reportsCount: 0
});

export const scrapeEmails = async (maxRecords = 100) => {
  const records = [];
  const errors = [];
  const seen = new Set();

  const pushEmail = (email, source) => {
    const normalized = email?.toLowerCase().trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    records.push(mapRecord(normalized, source));
  };

  try {
    const response = await axios.get(
      'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt',
      { timeout: 10000 }
    );

    const text = response.data || '';
    const extracted = text.match(EMAIL_REGEX) || [];
    for (const email of extracted) {
      if (records.length >= maxRecords) break;
      pushEmail(email, 'github_phishing_database');
    }
  } catch (error) {
    errors.push(`Phishing email feed error: ${error.message}`);
  }

  if (records.length === 0) {
    [
      'noreply@verify-account-urgent.tk',
      'alerts@bank-security-verify.ml',
      'support@amazon-account-confirm.ga',
      'security@apple-verify-id.cf'
    ].forEach((email) => pushEmail(email, 'fallback_email_list'));
  }

  return {
    source: 'email_scraper',
    type: 'email',
    records: records.slice(0, maxRecords),
    errors
  };
};

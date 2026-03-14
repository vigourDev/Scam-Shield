import axios from 'axios';

const FEED_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

class DomainIntelligenceService {
  constructor() {
    this.cache = {
      domains: new Set(),
      lastRefreshAt: 0,
      sources: {}
    };
  }

  normalizeDomain(input) {
    if (!input) return '';

    const raw = String(input).trim().toLowerCase();
    if (!raw) return '';

    try {
      const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      const hostname = new URL(withProtocol).hostname.toLowerCase();
      return hostname.replace(/^www\./, '');
    } catch {
      return raw.replace(/^www\./, '').split('/')[0];
    }
  }

  extractDomainFromUrl(value) {
    if (!value) return '';
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname.replace(/^www\./, '');
    } catch {
      return this.normalizeDomain(value);
    }
  }

  getDomainVariants(domain) {
    const normalized = this.normalizeDomain(domain);
    if (!normalized) return [];

    const parts = normalized.split('.');
    const variants = new Set([normalized]);

    for (let i = 1; i < parts.length - 1; i++) {
      variants.add(parts.slice(i).join('.'));
    }

    return Array.from(variants);
  }

  isCacheFresh() {
    return Date.now() - this.cache.lastRefreshAt < FEED_TTL_MS;
  }

  async refreshFeedsIfNeeded(force = false) {
    if (!force && this.isCacheFresh() && this.cache.domains.size > 0) {
      return;
    }

    const allDomains = new Set();
    const sourceStats = {};

    const addDomain = (domain, source) => {
      const normalized = this.normalizeDomain(domain);
      if (!normalized) return;
      allDomains.add(normalized);
      sourceStats[source] = (sourceStats[source] || 0) + 1;
    };

    const tasks = [
      this.fetchOpenPhish(addDomain),
      this.fetchPhishTank(addDomain),
      this.fetchPhishingDatabase(addDomain)
    ];

    await Promise.allSettled(tasks);

    this.cache.domains = allDomains;
    this.cache.lastRefreshAt = Date.now();
    this.cache.sources = sourceStats;
  }

  async fetchOpenPhish(addDomain) {
    const response = await axios.get('https://openphish.com/feed.txt', { timeout: 12000 });
    const lines = (response.data || '').split('\n').map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      addDomain(this.extractDomainFromUrl(line), 'openphish');
    }
  }

  async fetchPhishTank(addDomain) {
    const response = await axios.get('https://data.phishtank.com/data/online-valid.json', {
      timeout: 15000
    });

    const items = Array.isArray(response.data) ? response.data : [];
    for (const item of items) {
      if (!item?.url) continue;
      addDomain(this.extractDomainFromUrl(item.url), 'phishtank');
    }
  }

  async fetchPhishingDatabase(addDomain) {
    const response = await axios.get(
      'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt',
      { timeout: 12000 }
    );

    const lines = (response.data || '')
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line && !line.startsWith('#'));

    for (const line of lines) {
      addDomain(line, 'phishing_database_github');
    }
  }

  async checkDomain(domain) {
    const normalized = this.normalizeDomain(domain);
    if (!normalized) {
      return { flagged: false, domain: '', source: 'invalid' };
    }

    await this.refreshFeedsIfNeeded();

    const variants = this.getDomainVariants(normalized);
    const matched = variants.find((item) => this.cache.domains.has(item));

    if (matched) {
      return {
        flagged: true,
        domain: normalized,
        matchedDomain: matched,
        source: 'live_public_feeds',
        cachedAt: new Date(this.cache.lastRefreshAt)
      };
    }

    return {
      flagged: false,
      domain: normalized,
      source: 'live_public_feeds',
      cachedAt: new Date(this.cache.lastRefreshAt)
    };
  }
}

const domainIntelligenceService = new DomainIntelligenceService();

export default domainIntelligenceService;

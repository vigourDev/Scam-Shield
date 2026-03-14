import Identifier from '../models/Identifier.js';
import ScraperLog from '../models/ScraperLog.js';
import { scrapeWebsites } from './scrapers/websiteScraper.js';
import { scrapeTelegram } from './scrapers/telegramScraper.js';
import { scrapeEmails } from './scrapers/emailScraper.js';
import { scrapePhones } from './scrapers/phoneScraper.js';
import { scrapeBins } from './scrapers/binScraper.js';
import { scrapeReddit } from './scrapers/redditScraper.js';
import { scrapeGitHub } from './scrapers/githubScraper.js';
import { scrapeCrypto } from './scrapers/cryptoScraper.js';
import { scrapeStopForumSpam } from './scrapers/stopForumSpamScraper.js';

class ScraperService {
  constructor() {
    this.timer = null;
    this.lastRunAt = null;
    this.lastRunSummary = null;

    this.modules = [
      { key: 'website', run: scrapeWebsites },
      { key: 'telegram', run: scrapeTelegram },
      { key: 'email', run: scrapeEmails },
      { key: 'phone', run: scrapePhones },
      { key: 'card_bin', run: scrapeBins },
      { key: 'reddit', run: scrapeReddit },
      { key: 'github', run: scrapeGitHub },
      { key: 'crypto', run: scrapeCrypto },
      { key: 'stopforumspam', run: scrapeStopForumSpam }
    ];
  }

  async saveRecords(records) {
    let saved = 0;

    for (const record of records) {
      const existing = await Identifier.findOne({
        type: record.type,
        value: record.value
      });

      if (!existing) {
        const created = await Identifier.create(record);
        created.suspiciousPatterns = created.suspiciousPatterns || [];
        created.calculateRiskScore();
        // Guarantee scraped blacklisted identifiers are never silently marked "Safe".
        // blacklisted=true alone only adds 20 pts; minimum for "Suspicious" is 26.
        if (created.blacklisted && created.riskScore < 60) {
          created.riskScore = 60;
        }
        await created.save();
        saved += 1;
      }
    }

    return saved;
  }

  async runSingle(moduleKey, maxRecords = 100) {
    const module = this.modules.find((m) => m.key === moduleKey);
    if (!module) {
      throw new Error(`Unknown scraper module: ${moduleKey}`);
    }

    const startedAt = Date.now();
    const result = await module.run(maxRecords);
    const saved = await this.saveRecords(result.records || []);
    const durationMs = Date.now() - startedAt;

    const status = result.errors?.length
      ? (saved > 0 ? 'partial' : 'failed')
      : 'success';

    await ScraperLog.create({
      source: result.source,
      type: result.type,
      recordsFetched: (result.records || []).length,
      recordsSaved: saved,
      errorMessages: result.errors || [],
      durationMs,
      status
    });

    return {
      source: result.source,
      type: result.type,
      fetched: (result.records || []).length,
      saved,
      errors: result.errors || [],
      durationMs,
      status
    };
  }

  async runAll(maxRecords = 100) {
    const summary = {
      startedAt: new Date(),
      results: [],
      totalFetched: 0,
      totalSaved: 0,
      errorCount: 0
    };

    for (const module of this.modules) {
      const result = await this.runSingle(module.key, maxRecords);
      summary.results.push(result);
      summary.totalFetched += result.fetched;
      summary.totalSaved += result.saved;
      summary.errorCount += result.errors.length;
    }

    this.lastRunAt = new Date();
    this.lastRunSummary = summary;

    return summary;
  }

  startScheduler() {
    if (this.timer) return;

    const intervalHours = Number(process.env.SCRAPER_INTERVAL_HOURS || 6);
    const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;

    this.timer = setInterval(async () => {
      try {
        await this.runAll(Number(process.env.SCRAPER_MAX_RECORDS_PER_SOURCE || 100));
      } catch (error) {
        await ScraperLog.create({
          source: 'scheduler',
          type: 'all',
          recordsFetched: 0,
          recordsSaved: 0,
          errorMessages: [error.message],
          durationMs: 0,
          status: 'failed'
        });
      }
    }, intervalMs);
  }

  stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async getStatus() {
    const latestLogs = await ScraperLog.find({}).sort({ createdAt: -1 }).limit(10);

    return {
      schedulerActive: Boolean(this.timer),
      lastRunAt: this.lastRunAt,
      lastRunSummary: this.lastRunSummary,
      recentRuns: latestLogs
    };
  }
}

const scraperService = new ScraperService();

export default scraperService;

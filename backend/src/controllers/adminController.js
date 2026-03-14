import Report from '../models/Report.js';
import Identifier from '../models/Identifier.js';
import User from '../models/User.js';
import riskEngine from '../services/riskEngine.js';
import scraperService from '../services/scraperService.js';
import ScraperLog from '../models/ScraperLog.js';

export const approveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = 'verified';
    report.approvedBy = req.userId;
    await report.save();

    // Update identifier risk score
    await riskEngine.updateIdentifierRiskScore(report.identifierId);

    // Emit real-time event
    if (global.notificationService) {
      global.notificationService.broadcastReportApproved(report);
    }

    res.json({ message: 'Report approved successfully' });
  } catch (error) {
    console.error('Approve report error:', error);
    res.status(500).json({ message: 'Error approving report' });
  }
};

export const rejectReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reason } = req.body;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = 'rejected';
    report.rejectionReason = reason;
    report.approvedBy = req.userId;
    await report.save();

    res.json({ message: 'Report rejected successfully' });
  } catch (error) {
    console.error('Reject report error:', error);
    res.status(500).json({ message: 'Error rejecting report' });
  }
};

export const blacklistIdentifier = async (req, res) => {
  try {
    const { identifierId } = req.params;
    const { reason } = req.body;

    const identifier = await Identifier.findById(identifierId);

    if (!identifier) {
      return res.status(404).json({ message: 'Identifier not found' });
    }

    identifier.blacklisted = true;
    identifier.calculateRiskScore();
    await identifier.save();

    // Emit real-time event
    if (global.notificationService) {
      global.notificationService.broadcastBlacklistUpdate(identifier);
    }

    res.json({
      message: 'Identifier blacklisted successfully',
      identifier: {
        value: identifier.value,
        riskScore: identifier.riskScore
      }
    });
  } catch (error) {
    console.error('Blacklist identifier error:', error);
    res.status(500).json({ message: 'Error blacklisting identifier' });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = true;
    await user.save();

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Error banning user' });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = false;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ message: 'Error unbanning user' });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const verifiedReports = await Report.countDocuments({ status: 'verified' });
    const totalIdentifiers = await Identifier.countDocuments();
    const blacklistedIdentifiers = await Identifier.countDocuments({ blacklisted: true });
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });

    const reportsLast7Days = await Report.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      reports: {
        total: totalReports,
        pending: pendingReports,
        verified: verifiedReports,
        last7Days: reportsLast7Days
      },
      identifiers: {
        total: totalIdentifiers,
        blacklisted: blacklistedIdentifiers
      },
      users: {
        total: totalUsers,
        banned: bannedUsers
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

export const runScrapers = async (req, res) => {
  try {
    const { module, maxRecords } = req.body || {};
    const limit = Number(maxRecords || process.env.SCRAPER_MAX_RECORDS_PER_SOURCE || 100);

    if (module) {
      const result = await scraperService.runSingle(module, limit);
      return res.json({
        message: `Scraper '${module}' completed`,
        result
      });
    }

    const summary = await scraperService.runAll(limit);
    return res.json({
      message: 'All scrapers completed',
      summary
    });
  } catch (error) {
    console.error('Run scrapers error:', error);
    return res.status(500).json({ message: 'Error running scrapers' });
  }
};

export const getScraperStatus = async (req, res) => {
  try {
    const status = await scraperService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Get scraper status error:', error);
    res.status(500).json({ message: 'Error fetching scraper status' });
  }
};

export const getScraperLogs = async (req, res) => {
  try {
    const limit = Math.min(200, Number(req.query.limit || 50));
    const logs = await ScraperLog.find({}).sort({ createdAt: -1 }).limit(limit);
    res.json({ logs });
  } catch (error) {
    console.error('Get scraper logs error:', error);
    res.status(500).json({ message: 'Error fetching scraper logs' });
  }
};

import Report from '../models/Report.js';
import Identifier from '../models/Identifier.js';
import User from '../models/User.js';
import riskEngine from '../services/riskEngine.js';
import scamNetworkService from '../services/scamNetworkService.js';

export const submitReport = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User must be logged in to report' });
    }

    const { type, value, category, description, amountLost, currency, scamDate } = req.body;

    if (!type || !value || !category || !description) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const validTypes = ['phone', 'telegram', 'website', 'email', 'crypto', 'card_bin'];
    const validCategories = ['impersonation', 'phishing', 'ponzi', 'fake_investment', 'romance', 'money_laundering', 'other'];

    if (!validTypes.includes(type) || !validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid type or category' });
    }

    // Normalize value
    const normalizedValue = type === 'telegram' ? value.replace('@', '') : value;

    // Find or create identifier
    let identifier = await Identifier.findOne({ type, value: normalizedValue });

    if (!identifier) {
      identifier = new Identifier({
        type,
        value: normalizedValue,
        suspiciousPatterns: riskEngine.detectSuspiciousPatterns(normalizedValue, type),
        firstReported: new Date()
      });
      identifier.calculateRiskScore();
      await identifier.save();
    }

    // Create report
    const report = new Report({
      identifierId: identifier._id,
      type,
      value: normalizedValue,
      category,
      description,
      reporterId: req.userId,
      amountLost,
      currency,
      scamDate: scamDate ? new Date(scamDate) : null,
      status: 'pending'
    });

    await report.save();

    // Update identifier
    identifier.lastReported = new Date();
    const verifiedReports = await Report.countDocuments({
      identifierId: identifier._id,
      status: 'verified'
    });
    identifier.reportsCount = verifiedReports + 1;
    identifier.calculateRiskScore();
    await identifier.save();

    // Update scam network
    await scamNetworkService.linkIdentifiersFromReport(report._id);

    // Emit socket event for real-time update
    if (global.notificationService) {
      global.notificationService.broadcastNewReport(report);
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        id: report._id,
        status: report.status,
        identifier: {
          value: identifier.value,
          type: identifier.type
        }
      }
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Error submitting report' });
  }
};

export const getTrendingScams = async (req, res) => {
  try {
    const days = req.query.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trending = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          categories: { $push: '$category' },
          examples: { $push: '$value' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get top categories
    const topCategories = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      trendingTypes: trending,
      topCategories,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Trending scams error:', error);
    res.status(500).json({ message: 'Error fetching trending scams' });
  }
};

export const getUserReports = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User must be logged in' });
    }

    const reports = await Report.find({ reporterId: req.userId })
      .populate('identifierId', 'value type riskScore')
      .sort({ createdAt: -1 });

    res.json({
      reports: reports.map(r => ({
        id: r._id,
        identifier: {
          value: r.identifierId.value,
          type: r.identifierId.type
        },
        category: r.category,
        status: r.status,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

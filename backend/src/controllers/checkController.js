import Identifier from '../models/Identifier.js';
import Report from '../models/Report.js';
import SearchHistory from '../models/SearchHistory.js';
import riskEngine from '../services/riskEngine.js';
import ScamNetwork from '../models/ScamNetwork.js';
import BINLookupService from '../services/binLookupService.js';
import ReportGenerator from '../services/reportGenerator.js';

export const checkIdentifier = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || !value) {
      return res.status(400).json({ message: 'Type and value are required' });
    }

    const validTypes = ['phone', 'telegram', 'website', 'email', 'crypto', 'card_bin'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    // Normalize value
    const normalizedValue = type === 'telegram' ? value.replace('@', '') : value.trim();

    // Find or create identifier
    let identifier = await Identifier.findOne({ type, value: normalizedValue });

    if (!identifier) {
      // Create new identifier with default score
      identifier = new Identifier({
        type,
        value: normalizedValue,
        riskScore: 0
      });

      // Detect suspicious patterns
      identifier.suspiciousPatterns = riskEngine.detectSuspiciousPatterns(normalizedValue, type);
      identifier.calculateRiskScore();
      await identifier.save();
    }

    // Generate sample reports if none exist (for demo/testing)
    if (identifier && ['telegram', 'email', 'phone'].includes(type)) {
      await ReportGenerator.generateReportsForIdentifier(identifier);
    }

    // Get related reports
    const reports = await Report.find({
      identifierId: identifier._id,
      status: 'verified'
    })
      .select('category description reporterId createdAt')
      .populate('reporterId', 'username')
      .limit(10);

    // Get linked identifiers from scam network
    const network = await ScamNetwork.findOne({ identifierId: identifier._id })
      .populate('linkedIdentifiers.identifier', 'value type');

    // Save search history if user is logged in
    if (req.userId) {
      const search = new SearchHistory({
        userId: req.userId,
        value: normalizedValue,
        type,
        riskScore: identifier.riskScore
      });
      await search.save();
    }

    // Build response object
    const response = {
      identifier: {
        id: identifier._id,
        value: identifier.value,
        type: identifier.type,
        riskScore: identifier.riskScore,
        riskLevel: riskEngine.getRiskLevel(identifier.riskScore),
        reportsCount: identifier.reportsCount,
        isBlacklisted: identifier.blacklisted,
        firstReported: identifier.firstReported,
        lastReported: identifier.lastReported,
        suspiciousPatterns: identifier.suspiciousPatterns
      },
      reports: reports.map(r => ({
        id: r._id,
        category: r.category,
        description: r.description,
        reporter: r.reporterId?.username || 'Anonymous',
        createdAt: r.createdAt
      })),
      linkedIdentifiers: network?.linkedIdentifiers?.map(link => ({
        value: link.identifier?.value,
        type: link.identifier?.type,
        strength: link.strength
      })) || [],
      status: identifier.riskScore > 75 ? 'High Risk' : 
              identifier.riskScore > 50 ? 'Suspicious' : 
              identifier.riskScore > 25 ? 'Low Risk' : 'Safe'
    };

    // Add BIN details if card_bin type
    if (type === 'card_bin') {
      try {
        const binInfo = await BINLookupService.lookupBIN(normalizedValue);
        if (binInfo.success) {
          response.cardDetails = {
            bin: binInfo.bin,
            scheme: binInfo.scheme,
            type: binInfo.type,
            brand: binInfo.brand,
            bank: binInfo.bank,
            country: binInfo.country,
            cardLength: binInfo.length,
            luhnCheck: binInfo.luhn
          };
        } else {
          response.cardDetails = {
            error: binInfo.error,
            bin: normalizedValue
          };
        }
      } catch (binError) {
        // BIN lookup failure doesn't block the response
        response.cardDetails = {
          error: `Could not fetch BIN details: ${binError.message}`
        };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Check identifier error:', error);
    res.status(500).json({ message: 'Error checking identifier' });
  }
};

export const getReportsForIdentifier = async (req, res) => {
  try {
    const { value } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Type query parameter is required' });
    }

    const identifier = await Identifier.findOne({ type, value });

    if (!identifier) {
      return res.status(404).json({ message: 'Identifier not found' });
    }

    const reports = await Report.find({
      identifierId: identifier._id,
      status: 'verified'
    })
      .populate('reporterId', 'username')
      .sort({ createdAt: -1 });

    res.json({
      identifier: {
        value: identifier.value,
        type: identifier.type,
        riskScore: identifier.riskScore
      },
      reports: reports.map(r => ({
        id: r._id,
        category: r.category,
        description: r.description,
        reporter: r.reporterId?.username || 'Anonymous',
        amountLost: r.amountLost,
        currency: r.currency,
        scamDate: r.scamDate,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

/**
 * Public BIN lookup endpoint
 * Fetches detailed card information from Binlist.io
 * No authentication required
 */
export const lookupBIN = async (req, res) => {
  try {
    const { bin } = req.body;

    if (!bin) {
      return res.status(400).json({ message: 'BIN number is required' });
    }

    // Validate BIN format
    if (!/^\d{6}$/.test(bin.toString())) {
      return res.status(400).json({ message: 'BIN must be exactly 6 digits' });
    }

    // Get BIN details from public API
    const binDetails = await BINLookupService.lookupBIN(bin);

    if (!binDetails.success) {
      return res.status(404).json({
        message: binDetails.error,
        bin: bin
      });
    }

    // Check if BIN is in our fraud database
    const fraudRecord = await Identifier.findOne({
      type: 'card_bin',
      value: bin
    });

    const response = {
      bin: bin,
      publicData: {
        scheme: binDetails.scheme,
        type: binDetails.type,
        brand: binDetails.brand,
        bank: binDetails.bank,
        country: binDetails.country,
        cardLength: binDetails.length,
        luhnCheck: binDetails.luhn
      }
    };

    // Add fraud information if available
    if (fraudRecord) {
      response.fraud = {
        isKnownFraud: true,
        category: fraudRecord.category,
        description: fraudRecord.description,
        reportsCount: fraudRecord.reportsCount,
        blacklisted: fraudRecord.blacklisted,
        riskScore: fraudRecord.riskScore,
        riskLevel: riskEngine.getRiskLevel(fraudRecord.riskScore)
      };
    } else {
      response.fraud = {
        isKnownFraud: false,
        message: 'Not found in fraud database'
      };
    }

    res.json(response);

  } catch (error) {
    console.error('BIN lookup error:', error);
    res.status(500).json({ message: 'Error looking up BIN information' });
  }
};

import Identifier from '../models/Identifier.js';
import Report from '../models/Report.js';
import SearchHistory from '../models/SearchHistory.js';
import riskEngine from '../services/riskEngine.js';
import ScamNetwork from '../models/ScamNetwork.js';
import BINLookupService from '../services/binLookupService.js';
import domainIntelligenceService from '../services/domainIntelligenceService.js';
import liveIntelligenceService from '../services/liveIntelligenceService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeWebsiteValue = (value) => domainIntelligenceService.normalizeDomain(value);

const PHONE_ORIGIN_MAP = [
  // North America
  { code: '+1', country: 'United States / Canada', region: 'North America' },
  // Caribbean / Central America (3-digit codes starting with +1 — sorted longest first)
  { code: '+1242', country: 'Bahamas', region: 'Caribbean' },
  { code: '+1246', country: 'Barbados', region: 'Caribbean' },
  { code: '+1264', country: 'Anguilla', region: 'Caribbean' },
  { code: '+1268', country: 'Antigua and Barbuda', region: 'Caribbean' },
  { code: '+1284', country: 'British Virgin Islands', region: 'Caribbean' },
  { code: '+1340', country: 'US Virgin Islands', region: 'Caribbean' },
  { code: '+1345', country: 'Cayman Islands', region: 'Caribbean' },
  { code: '+1441', country: 'Bermuda', region: 'North America' },
  { code: '+1473', country: 'Grenada', region: 'Caribbean' },
  { code: '+1649', country: 'Turks and Caicos Islands', region: 'Caribbean' },
  { code: '+1658', country: 'Jamaica', region: 'Caribbean' },
  { code: '+1664', country: 'Montserrat', region: 'Caribbean' },
  { code: '+1670', country: 'Northern Mariana Islands', region: 'Oceania' },
  { code: '+1671', country: 'Guam', region: 'Oceania' },
  { code: '+1684', country: 'American Samoa', region: 'Oceania' },
  { code: '+1721', country: 'Sint Maarten', region: 'Caribbean' },
  { code: '+1758', country: 'Saint Lucia', region: 'Caribbean' },
  { code: '+1767', country: 'Dominica', region: 'Caribbean' },
  { code: '+1784', country: 'Saint Vincent and the Grenadines', region: 'Caribbean' },
  { code: '+1809', country: 'Dominican Republic', region: 'Caribbean' },
  { code: '+1829', country: 'Dominican Republic', region: 'Caribbean' },
  { code: '+1849', country: 'Dominican Republic', region: 'Caribbean' },
  { code: '+1868', country: 'Trinidad and Tobago', region: 'Caribbean' },
  { code: '+1869', country: 'Saint Kitts and Nevis', region: 'Caribbean' },
  { code: '+1876', country: 'Jamaica', region: 'Caribbean' },
  // Europe
  { code: '+44', country: 'United Kingdom', region: 'Europe' },
  { code: '+33', country: 'France', region: 'Europe' },
  { code: '+49', country: 'Germany', region: 'Europe' },
  { code: '+39', country: 'Italy', region: 'Europe' },
  { code: '+34', country: 'Spain', region: 'Europe' },
  { code: '+351', country: 'Portugal', region: 'Europe' },
  { code: '+31', country: 'Netherlands', region: 'Europe' },
  { code: '+32', country: 'Belgium', region: 'Europe' },
  { code: '+41', country: 'Switzerland', region: 'Europe' },
  { code: '+43', country: 'Austria', region: 'Europe' },
  { code: '+45', country: 'Denmark', region: 'Europe' },
  { code: '+46', country: 'Sweden', region: 'Europe' },
  { code: '+47', country: 'Norway', region: 'Europe' },
  { code: '+48', country: 'Poland', region: 'Europe' },
  { code: '+353', country: 'Ireland', region: 'Europe' },
  { code: '+354', country: 'Iceland', region: 'Europe' },
  { code: '+358', country: 'Finland', region: 'Europe' },
  { code: '+359', country: 'Bulgaria', region: 'Europe' },
  { code: '+36', country: 'Hungary', region: 'Europe' },
  { code: '+370', country: 'Lithuania', region: 'Europe' },
  { code: '+371', country: 'Latvia', region: 'Europe' },
  { code: '+372', country: 'Estonia', region: 'Europe' },
  { code: '+373', country: 'Moldova', region: 'Europe' },
  { code: '+374', country: 'Armenia', region: 'Europe' },
  { code: '+375', country: 'Belarus', region: 'Europe' },
  { code: '+376', country: 'Andorra', region: 'Europe' },
  { code: '+380', country: 'Ukraine', region: 'Europe' },
  { code: '+381', country: 'Serbia', region: 'Europe' },
  { code: '+382', country: 'Montenegro', region: 'Europe' },
  { code: '+383', country: 'Kosovo', region: 'Europe' },
  { code: '+385', country: 'Croatia', region: 'Europe' },
  { code: '+386', country: 'Slovenia', region: 'Europe' },
  { code: '+387', country: 'Bosnia and Herzegovina', region: 'Europe' },
  { code: '+389', country: 'North Macedonia', region: 'Europe' },
  { code: '+40', country: 'Romania', region: 'Europe' },
  { code: '+420', country: 'Czech Republic', region: 'Europe' },
  { code: '+421', country: 'Slovakia', region: 'Europe' },
  { code: '+423', country: 'Liechtenstein', region: 'Europe' },
  { code: '+350', country: 'Gibraltar', region: 'Europe' },
  { code: '+352', country: 'Luxembourg', region: 'Europe' },
  { code: '+356', country: 'Malta', region: 'Europe' },
  { code: '+357', country: 'Cyprus', region: 'Europe' },
  // Russia / Central Asia
  { code: '+7', country: 'Russia / Kazakhstan', region: 'Europe / Asia' },
  { code: '+77', country: 'Kazakhstan', region: 'Central Asia' },
  { code: '+992', country: 'Tajikistan', region: 'Central Asia' },
  { code: '+993', country: 'Turkmenistan', region: 'Central Asia' },
  { code: '+994', country: 'Azerbaijan', region: 'Central Asia' },
  { code: '+995', country: 'Georgia', region: 'Europe' },
  { code: '+996', country: 'Kyrgyzstan', region: 'Central Asia' },
  { code: '+998', country: 'Uzbekistan', region: 'Central Asia' },
  // Asia
  { code: '+86', country: 'China', region: 'East Asia' },
  { code: '+81', country: 'Japan', region: 'East Asia' },
  { code: '+82', country: 'South Korea', region: 'East Asia' },
  { code: '+852', country: 'Hong Kong', region: 'East Asia' },
  { code: '+853', country: 'Macau', region: 'East Asia' },
  { code: '+886', country: 'Taiwan', region: 'East Asia' },
  { code: '+91', country: 'India', region: 'South Asia' },
  { code: '+92', country: 'Pakistan', region: 'South Asia' },
  { code: '+93', country: 'Afghanistan', region: 'South Asia' },
  { code: '+94', country: 'Sri Lanka', region: 'South Asia' },
  { code: '+95', country: 'Myanmar', region: 'Southeast Asia' },
  { code: '+880', country: 'Bangladesh', region: 'South Asia' },
  { code: '+960', country: 'Maldives', region: 'South Asia' },
  { code: '+975', country: 'Bhutan', region: 'South Asia' },
  { code: '+977', country: 'Nepal', region: 'South Asia' },
  // Southeast Asia
  { code: '+60', country: 'Malaysia', region: 'Southeast Asia' },
  { code: '+62', country: 'Indonesia', region: 'Southeast Asia' },
  { code: '+63', country: 'Philippines', region: 'Southeast Asia' },
  { code: '+65', country: 'Singapore', region: 'Southeast Asia' },
  { code: '+66', country: 'Thailand', region: 'Southeast Asia' },
  { code: '+84', country: 'Vietnam', region: 'Southeast Asia' },
  { code: '+855', country: 'Cambodia', region: 'Southeast Asia' },
  { code: '+856', country: 'Laos', region: 'Southeast Asia' },
  { code: '+670', country: 'East Timor', region: 'Southeast Asia' },
  { code: '+673', country: 'Brunei', region: 'Southeast Asia' },
  // Middle East
  { code: '+90', country: 'Turkey', region: 'Middle East' },
  { code: '+961', country: 'Lebanon', region: 'Middle East' },
  { code: '+962', country: 'Jordan', region: 'Middle East' },
  { code: '+963', country: 'Syria', region: 'Middle East' },
  { code: '+964', country: 'Iraq', region: 'Middle East' },
  { code: '+965', country: 'Kuwait', region: 'Middle East' },
  { code: '+966', country: 'Saudi Arabia', region: 'Middle East' },
  { code: '+967', country: 'Yemen', region: 'Middle East' },
  { code: '+968', country: 'Oman', region: 'Middle East' },
  { code: '+970', country: 'Palestine', region: 'Middle East' },
  { code: '+971', country: 'United Arab Emirates', region: 'Middle East' },
  { code: '+972', country: 'Israel', region: 'Middle East' },
  { code: '+973', country: 'Bahrain', region: 'Middle East' },
  { code: '+974', country: 'Qatar', region: 'Middle East' },
  { code: '+98', country: 'Iran', region: 'Middle East' },
  // Africa
  { code: '+20', country: 'Egypt', region: 'Africa' },
  { code: '+211', country: 'South Sudan', region: 'Africa' },
  { code: '+212', country: 'Morocco', region: 'Africa' },
  { code: '+213', country: 'Algeria', region: 'Africa' },
  { code: '+216', country: 'Tunisia', region: 'Africa' },
  { code: '+218', country: 'Libya', region: 'Africa' },
  { code: '+220', country: 'Gambia', region: 'Africa' },
  { code: '+221', country: 'Senegal', region: 'Africa' },
  { code: '+222', country: 'Mauritania', region: 'Africa' },
  { code: '+223', country: 'Mali', region: 'Africa' },
  { code: '+224', country: 'Guinea', region: 'Africa' },
  { code: '+225', country: 'Ivory Coast', region: 'Africa' },
  { code: '+226', country: 'Burkina Faso', region: 'Africa' },
  { code: '+227', country: 'Niger', region: 'Africa' },
  { code: '+228', country: 'Togo', region: 'Africa' },
  { code: '+229', country: 'Benin', region: 'Africa' },
  { code: '+230', country: 'Mauritius', region: 'Africa' },
  { code: '+231', country: 'Liberia', region: 'Africa' },
  { code: '+232', country: 'Sierra Leone', region: 'Africa' },
  { code: '+233', country: 'Ghana', region: 'Africa' },
  { code: '+234', country: 'Nigeria', region: 'Africa' },
  { code: '+235', country: 'Chad', region: 'Africa' },
  { code: '+236', country: 'Central African Republic', region: 'Africa' },
  { code: '+237', country: 'Cameroon', region: 'Africa' },
  { code: '+238', country: 'Cape Verde', region: 'Africa' },
  { code: '+239', country: 'Sao Tome and Principe', region: 'Africa' },
  { code: '+240', country: 'Equatorial Guinea', region: 'Africa' },
  { code: '+241', country: 'Gabon', region: 'Africa' },
  { code: '+242', country: 'Republic of the Congo', region: 'Africa' },
  { code: '+243', country: 'DR Congo', region: 'Africa' },
  { code: '+244', country: 'Angola', region: 'Africa' },
  { code: '+245', country: 'Guinea-Bissau', region: 'Africa' },
  { code: '+248', country: 'Seychelles', region: 'Africa' },
  { code: '+249', country: 'Sudan', region: 'Africa' },
  { code: '+250', country: 'Rwanda', region: 'Africa' },
  { code: '+251', country: 'Ethiopia', region: 'Africa' },
  { code: '+252', country: 'Somalia', region: 'Africa' },
  { code: '+253', country: 'Djibouti', region: 'Africa' },
  { code: '+254', country: 'Kenya', region: 'Africa' },
  { code: '+255', country: 'Tanzania', region: 'Africa' },
  { code: '+256', country: 'Uganda', region: 'Africa' },
  { code: '+257', country: 'Burundi', region: 'Africa' },
  { code: '+258', country: 'Mozambique', region: 'Africa' },
  { code: '+260', country: 'Zambia', region: 'Africa' },
  { code: '+261', country: 'Madagascar', region: 'Africa' },
  { code: '+263', country: 'Zimbabwe', region: 'Africa' },
  { code: '+264', country: 'Namibia', region: 'Africa' },
  { code: '+265', country: 'Malawi', region: 'Africa' },
  { code: '+266', country: 'Lesotho', region: 'Africa' },
  { code: '+267', country: 'Botswana', region: 'Africa' },
  { code: '+268', country: 'Eswatini', region: 'Africa' },
  { code: '+269', country: 'Comoros', region: 'Africa' },
  { code: '+27', country: 'South Africa', region: 'Africa' },
  { code: '+290', country: 'Saint Helena', region: 'Africa' },
  { code: '+291', country: 'Eritrea', region: 'Africa' },
  // Oceania
  { code: '+61', country: 'Australia', region: 'Oceania' },
  { code: '+64', country: 'New Zealand', region: 'Oceania' },
  { code: '+675', country: 'Papua New Guinea', region: 'Oceania' },
  { code: '+676', country: 'Tonga', region: 'Oceania' },
  { code: '+677', country: 'Solomon Islands', region: 'Oceania' },
  { code: '+678', country: 'Vanuatu', region: 'Oceania' },
  { code: '+679', country: 'Fiji', region: 'Oceania' },
  { code: '+680', country: 'Palau', region: 'Oceania' },
  { code: '+685', country: 'Samoa', region: 'Oceania' },
  { code: '+686', country: 'Kiribati', region: 'Oceania' },
  { code: '+688', country: 'Tuvalu', region: 'Oceania' },
  { code: '+691', country: 'Micronesia', region: 'Oceania' },
  { code: '+692', country: 'Marshall Islands', region: 'Oceania' },
  // South America
  { code: '+54', country: 'Argentina', region: 'South America' },
  { code: '+55', country: 'Brazil', region: 'South America' },
  { code: '+56', country: 'Chile', region: 'South America' },
  { code: '+57', country: 'Colombia', region: 'South America' },
  { code: '+58', country: 'Venezuela', region: 'South America' },
  { code: '+51', country: 'Peru', region: 'South America' },
  { code: '+591', country: 'Bolivia', region: 'South America' },
  { code: '+592', country: 'Guyana', region: 'South America' },
  { code: '+593', country: 'Ecuador', region: 'South America' },
  { code: '+594', country: 'French Guiana', region: 'South America' },
  { code: '+595', country: 'Paraguay', region: 'South America' },
  { code: '+597', country: 'Suriname', region: 'South America' },
  { code: '+598', country: 'Uruguay', region: 'South America' },
  // Central America / Mexico
  { code: '+52', country: 'Mexico', region: 'North America' },
  { code: '+501', country: 'Belize', region: 'Central America' },
  { code: '+502', country: 'Guatemala', region: 'Central America' },
  { code: '+503', country: 'El Salvador', region: 'Central America' },
  { code: '+504', country: 'Honduras', region: 'Central America' },
  { code: '+505', country: 'Nicaragua', region: 'Central America' },
  { code: '+506', country: 'Costa Rica', region: 'Central America' },
  { code: '+507', country: 'Panama', region: 'Central America' },
  { code: '+509', country: 'Haiti', region: 'Caribbean' },
  { code: '+53', country: 'Cuba', region: 'Caribbean' }
].sort((a, b) => b.code.length - a.code.length);

const getPhoneOrigin = (value) => {
  const raw = String(value || '').trim();
  const userIncludedPlus = raw.startsWith('+');
  const normalized = raw.replace(/[^\d+]/g, '');

  // Only add '+' for country-code lookup; display the number as the user typed it
  const forLookup = normalized.startsWith('+') ? normalized : `+${normalized}`;
  const match = PHONE_ORIGIN_MAP.find((item) => forLookup.startsWith(item.code));

  // Derive the local number portion (digits after the country code)
  const localNumber = match
    ? normalized.replace(/^\+/, '').slice(match.code.length - 1)
    : normalized.replace(/^\+/, '');

  return {
    normalized: userIncludedPlus ? forLookup : normalized,
    countryCode: match?.code || 'Unknown',
    country: match?.country || 'Unknown',
    region: match?.region || 'Unknown',
    localNumber
  };
};

/**
 * Build a human-readable fraud risk profile for a card BIN.
 * Based on card type (prepaid, virtual), bank, and fraud database status.
 */
const buildBinFraudProfile = (binInfo, identifier) => {
  const risks = [];
  let riskScore = identifier?.riskScore || 0;

  if (binInfo) {
    const cardType = (binInfo.type || '').toLowerCase();
    const brand = (binInfo.brand || '').toLowerCase();

    // Prepaid cards: very commonly used in gift-card and advance-fee scams
    if (cardType === 'prepaid') {
      risks.push({
        factor: 'Prepaid Card',
        severity: 'high',
        detail: 'Prepaid cards are a top tool in romance scams, gift card fraud, and advance-fee scams. Scammers specifically request these because they\'re anonymous and non-reversible.'
      });
      riskScore = Math.min(riskScore + 25, 100);
    }

    // Virtual cards: disposable, commonly used in identity fraud and chargebacks
    if (brand.includes('virtual') || brand.includes('vcc')) {
      risks.push({
        factor: 'Virtual / Disposable Card',
        severity: 'medium',
        detail: 'Virtual cards can be generated in bulk and disposed of quickly, making them a common tool in online fraud and subscription abuse.'
      });
      riskScore = Math.min(riskScore + 15, 100);
    }

    // Unknown bank may indicate a shell or fintech-issued card with less oversight
    if (!binInfo.bank?.name || binInfo.bank.name === 'UNKNOWN') {
      risks.push({
        factor: 'Unknown Issuing Bank',
        severity: 'low',
        detail: 'The issuing bank could not be identified. Cards from unrecognised issuers may have less fraud oversight.'
      });
    }
  }

  // Already in fraud database
  if (identifier?.blacklisted) {
    risks.push({
      factor: 'Flagged in Fraud Database',
      severity: 'high',
      detail: `This BIN appears in our scam database${identifier.source ? ` (source: ${identifier.source})` : ''}. Cards with this prefix have been associated with fraudulent activity.`
    });
  }

  const finalScore = Math.min(riskScore, 100);
  return {
    riskScore: finalScore,
    riskLevel: finalScore > 60 ? 'High' : finalScore > 30 ? 'Medium' : 'Low',
    factors: risks,
    inFraudDatabase: identifier?.blacklisted || false,
    advice: risks.length > 0
      ? 'Exercise caution. Do not send money or share card details with unverified parties. Scammers often instruct victims to buy prepaid cards and read the numbers aloud.'
      : 'No specific fraud indicators detected for this BIN. Always verify the recipient before sending any payment.'
  };
};

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

    // Normalize value by type
    let normalizedValue = value.trim();
    if (type === 'telegram') {
      normalizedValue = normalizedValue.replace('@', '').toLowerCase();
    } else if (type === 'website') {
      normalizedValue = normalizeWebsiteValue(normalizedValue);
    } else if (type === 'email') {
      normalizedValue = normalizedValue.toLowerCase();
    }

    if (!normalizedValue) {
      return res.status(400).json({ message: 'Invalid identifier value' });
    }

    // Find existing identifier
    let identifier;
    if (type === 'website') {
      const domainPattern = new RegExp(`(^|\\.)${escapeRegex(normalizedValue)}$`, 'i');
      identifier = await Identifier.findOne({
        type,
        $or: [
          { value: normalizedValue },
          { value: `www.${normalizedValue}` },
          { value: { $regex: domainPattern } }
        ]
      });
    } else {
      identifier = await Identifier.findOne({ type, value: normalizedValue });
    }

    if (!identifier) {
      let bootstrapped = false;

      // For website lookups, do a live feed check to reduce false negatives
      if (type === 'website') {
        try {
          const liveCheck = await domainIntelligenceService.checkDomain(normalizedValue);
          if (liveCheck.flagged) {
            identifier = new Identifier({
              type,
              value: normalizedValue,
              blacklisted: true,
              reportsCount: 25,
              source: liveCheck.source,
              isPublicData: true
            });
            bootstrapped = true;
          }
        } catch (liveCheckError) {
          console.warn(`Live website check failed: ${liveCheckError.message}`);
        }
      }

      if (!bootstrapped) {
        // Create new identifier with default score
        identifier = new Identifier({
          type,
          value: normalizedValue,
          riskScore: 0
        });
      }

      // Detect suspicious patterns
      identifier.suspiciousPatterns = riskEngine.detectSuspiciousPatterns(normalizedValue, type);
      identifier.calculateRiskScore();
      await identifier.save();
    }

    // Reports come only from real user submissions and scraped intelligence data.
    // Auto-generation was removed — it created false positives for clean identifiers.

    // Auto-correct legacy inflated scores from prior buggy incremental logic.
    const baselineRiskScore = riskEngine.calculateRiskScore(
      identifier.reportsCount || 0,
      Boolean(identifier.blacklisted),
      identifier.suspiciousPatterns?.length || 0
    );
    if (identifier.riskScore !== baselineRiskScore) {
      identifier.riskScore = baselineRiskScore;
      await identifier.save();
    }

    // ── Live intelligence: always runs, in parallel with DB report fetch ──────
    // Queries Reddit, GitHub, DuckDuckGo, URLscan.io, PhishTank, ThreatFox
    // simultaneously. Never gated on DB risk score — provides real-time signal
    // even for identifiers not yet in the database.
    let liveIntelligence = null;
    const liveSearchPromise = liveIntelligenceService.searchAll(type, normalizedValue).catch(err => {
      console.warn(`Live intelligence search failed: ${err.message}`);
      return null;
    });

    // Get related reports AND live intelligence simultaneously
    const [reports, network] = await Promise.all([
      Report.find({ identifierId: identifier._id, status: 'verified' })
        .select('category description reporterId createdAt')
        .populate('reporterId', 'username')
        .limit(10),
      ScamNetwork.findOne({ identifierId: identifier._id })
        .populate('linkedIdentifiers.identifier', 'value type')
    ]);

    // Await live intelligence (was already running in parallel above)
    liveIntelligence = await liveSearchPromise;

    // Compute effective score for this response only (do NOT persist live boost).
    // Prevents repeated clicks from incrementing risk score to 100.
    const liveRiskBoost = liveIntelligence?.riskBoost || 0;
    const effectiveRiskScore = Math.min(baselineRiskScore + liveRiskBoost, 100);
    const effectiveBlacklisted = identifier.blacklisted || (
      Boolean(liveIntelligence?.flagged) && (liveIntelligence?.confidence === 'high' || liveRiskBoost >= 20)
    );

    // Save search history if user is logged in
    if (req.userId) {
      const search = new SearchHistory({
        userId: req.userId,
        value: normalizedValue,
        type,
        riskScore: effectiveRiskScore
      });
      await search.save();
    }

    // Build response object
    const response = {
      identifier: {
        id: identifier._id,
        value: identifier.value,
        type: identifier.type,
        riskScore: effectiveRiskScore,
        baseRiskScore: baselineRiskScore,
        riskLevel: riskEngine.getRiskLevel(effectiveRiskScore),
        reportsCount: identifier.reportsCount,
        isBlacklisted: effectiveBlacklisted,
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
      status: effectiveRiskScore > 75 ? 'High Risk' : 
              effectiveRiskScore > 50 ? 'Suspicious' : 
              effectiveRiskScore > 25 ? 'Low Risk' : 'Safe',
      liveIntelligence: liveIntelligence
        ? {
            found: liveIntelligence.found,
            mentions: liveIntelligence.mentions,
            flagged: liveIntelligence.flagged,
            riskBoost: liveIntelligence.riskBoost,
            confidence: liveIntelligence.confidence,
            fromCache: liveIntelligence.fromCache || false,
            searchedAt: liveIntelligence.searchedAt,
            sources: liveIntelligence.sources
          }
        : null
    };

    if (type === 'phone') {
      response.phoneDetails = getPhoneOrigin(normalizedValue);
    }

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
            luhnCheck: binInfo.luhn,
            fraudRiskProfile: buildBinFraudProfile(binInfo, identifier)
          };
        } else {
          response.cardDetails = {
            error: binInfo.error,
            bin: normalizedValue,
            fraudRiskProfile: buildBinFraudProfile(null, identifier)
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

export const searchFraudIntelligence = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || !value) {
      return res.status(400).json({ message: 'Type and value are required' });
    }

    const validTypes = ['phone', 'telegram', 'website', 'email', 'crypto', 'card_bin'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    let normalizedValue = String(value).trim();
    if (type === 'telegram') {
      normalizedValue = normalizedValue.replace('@', '').toLowerCase();
    } else if (type === 'website') {
      normalizedValue = normalizeWebsiteValue(normalizedValue);
    } else if (type === 'email') {
      normalizedValue = normalizedValue.toLowerCase();
    }

    if (!normalizedValue) {
      return res.status(400).json({ message: 'Invalid identifier value' });
    }

    const intelligence = await liveIntelligenceService.searchAll(type, normalizedValue);

    return res.json({
      query: {
        type,
        value: normalizedValue
      },
      intelligence: {
        found: intelligence.found,
        mentions: intelligence.mentions,
        flagged: intelligence.flagged,
        riskBoost: intelligence.riskBoost,
        riskLevel: intelligence.riskLevel,
        fromCache: intelligence.fromCache || false,
        searchedAt: intelligence.searchedAt,
        sources: intelligence.sources
      }
    });
  } catch (error) {
    console.error('Search fraud intelligence error:', error);
    return res.status(500).json({ message: 'Error searching live intelligence' });
  }
};

import Identifier from '../models/Identifier.js';
import Report from '../models/Report.js';

class RiskEngine {
  /**
   * Calculate risk score for an identifier
   * Formula: (number_of_reports * 10) + blacklist_flag + suspicious_pattern
   */
  calculateRiskScore(reportsCount, isBlacklisted, suspiciousPatternCount) {
    let score = (reportsCount * 10) + (isBlacklisted ? 20 : 0) + (suspiciousPatternCount * 5);
    return Math.min(score, 100);
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score === 0) return 'Unknown';
    if (score <= 25) return 'Safe';
    if (score <= 50) return 'Suspicious';
    if (score <= 75) return 'Dangerous';
    return 'Confirmed Scam';
  }

  /**
   * Detect suspicious patterns in identifiers
   */
  detectSuspiciousPatterns(value, type) {
    const patterns = [];

    // Telegram patterns
    if (type === 'telegram') {
      if (/^@.*(crypto|fast|profit|money|invest|bitcoin|secure|bank).*/i.test(value)) {
        patterns.push('suspicious_keywords');
      }
      if (/^@[a-z0-9]{1,3}$/i.test(value)) {
        patterns.push('suspiciously_short');
      }
      if (value.length > 32) patterns.push('suspiciously_long');
    }

    // Email patterns
    if (type === 'email') {
      if (/\d{4}@/.test(value)) patterns.push('number_prefix');
      if (/(\.tk|\.ml|\.ga|\.cf)$/i.test(value)) patterns.push('free_domain');
    }

    // Cryptocurrency wallet patterns
    if (type === 'crypto') {
      if (value.length < 20) patterns.push('invalid_length');
    }

    // Phone patterns
    if (type === 'phone') {
      if (/0{4,}/.test(value)) patterns.push('repeated_zeros');
    }

    return patterns;
  }

  /**
   * Update risk score for identifier after new report
   */
  async updateIdentifierRiskScore(identifierId) {
    const identifier = await Identifier.findById(identifierId);
    if (!identifier) return null;

    const reportsCount = await Report.countDocuments({
      identifierId,
      status: 'verified'
    });

    identifier.reportsCount = reportsCount;
    const suspiciousPatternCount = identifier.suspiciousPatterns?.length || 0;
    
    const newScore = this.calculateRiskScore(
      reportsCount,
      identifier.blacklisted,
      suspiciousPatternCount
    );

    identifier.riskScore = newScore;
    await identifier.save();
    return identifier;
  }
}

export default new RiskEngine();

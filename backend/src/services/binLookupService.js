import axios from 'axios';

class BINLookupService {
  /**
   * Lookup detailed information about a credit card BIN
   * Uses free Binlist.io API - no authentication required
   * 
   * @param {string} bin - 6-digit card BIN number (e.g., "485275")
   * @returns {Promise<object>} Card information including bank, scheme, country
   */
  static async lookupBIN(bin) {
    try {
      // Validate BIN format
      if (!bin || !/^\d{6}$/.test(bin)) {
        return {
          success: false,
          error: 'Invalid BIN format. Must be 6 digits.'
        };
      }

      // Call Binlist.io API
      const response = await axios.get(`https://lookup.binlist.net/${bin}`, {
        timeout: 5000,
        headers: {
          'Accept-Version': '3'
        }
      });

      const data = response.data;

      return {
        success: true,
        bin: bin,
        scheme: data.scheme || 'UNKNOWN',           // VISA, MASTERCARD, etc.
        type: data.type || 'UNKNOWN',               // credit, debit, etc.
        brand: data.brand || 'UNKNOWN',             // Card brand
        bank: {
          name: data.bank?.name || 'UNKNOWN',
          url: data.bank?.url || null,
          phone: data.bank?.phone || null,
          city: data.bank?.city || null
        },
        country: {
          numeric: data.country?.numeric || null,
          alpha2: data.country?.alpha2 || null,
          name: data.country?.name || 'UNKNOWN',
          emoji: data.country?.emoji || null,
          currency: data.country?.currency || null
        },
        length: data.length || null,
        luhn: data.luhn !== undefined ? data.luhn : null
      };

    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          success: false,
          bin: bin,
          error: 'BIN not found in database',
          status: 404
        };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          bin: bin,
          error: 'API request timeout',
          status: 408
        };
      }

      return {
        success: false,
        bin: bin,
        error: `Failed to lookup BIN: ${error.message}`,
        status: 500
      };
    }
  }

  /**
   * Check if a BIN is in the fraud database
   * @param {string} bin - 6-digit card BIN number
   * @returns {Promise<object>} Fraud status and details
   */
  static async checkFraudStatus(bin, db) {
    try {
      // Check if BIN exists in our fraud database
      const fraudRecord = await db.Identifier.findOne({
        type: 'card_bin',
        value: bin
      });

      if (fraudRecord) {
        return {
          isFraud: true,
          riskLevel: 'HIGH',
          category: fraudRecord.category,
          description: fraudRecord.description,
          reportsCount: fraudRecord.reportsCount,
          blacklisted: fraudRecord.blacklisted,
          riskScore: fraudRecord.riskScore || 0
        };
      }

      return {
        isFraud: false,
        riskLevel: 'SAFE',
        description: 'Not found in fraud database'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to check fraud status: ${error.message}`
      };
    }
  }

  /**
   * Complete BIN check: Get details + fraud status
   * @param {string} bin - 6-digit card BIN number
   * @param {object} db - Database connection (optional)
   * @returns {Promise<object>} Complete BIN information with fraud check
   */
  static async completeBINCheck(bin, db = null) {
    try {
      // Get public BIN details
      const binDetails = await this.lookupBIN(bin);

      // If DB available, check fraud status
      let fraudStatus = { isFraud: false, riskLevel: 'UNKNOWN' };
      if (db) {
        fraudStatus = await this.checkFraudStatus(bin, db);
      }

      return {
        bin: bin,
        publicData: binDetails,
        fraudStatus: fraudStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        bin: bin,
        error: `Complete BIN check failed: ${error.message}`
      };
    }
  }

  /**
   * Validate card number using Luhn algorithm
   * @param {string} cardNumber - Full card number
   * @returns {boolean} Valid or invalid
   */
  static validateCardNumber(cardNumber) {
    // Remove spaces and hyphens
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Extract BIN from full card number
   * @param {string} cardNumber - Full card number
   * @returns {string} First 6 digits (BIN)
   */
  static extractBIN(cardNumber) {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    return cleaned.substring(0, 6);
  }

  /**
   * Mask card number for display (show only last 4 digits)
   * @param {string} cardNumber - Full card number
   * @returns {string} Masked card number
   */
  static maskCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    const lastFour = cleaned.slice(-4);
    return `****-****-****-${lastFour}`;
  }
}

export default BINLookupService;

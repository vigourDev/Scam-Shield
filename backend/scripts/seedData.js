import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Identifier from '../src/models/Identifier.js';
import connectDB from '../src/database/connection.js';
import riskEngine from '../src/services/riskEngine.js';

dotenv.config();

/**
 * Public scam data sources
 * These are sample data - in production, you would fetch from real public APIs
 */
const publicScamData = {
  // Telegram scam bots and channels
  telegram: [
    { value: 'crypto_fastprofit', risk: 95, category: 'fake_investment' },
    { value: 'moneydoubler_bot', risk: 90, category: 'ponzi' },
    { value: 'instant_btc_claim', risk: 85, category: 'phishing' },
    { value: 'telegram_support_bot', risk: 80, category: 'impersonation' },
    { value: 'wallet_recovery_service', risk: 88, category: 'scam' }
  ],
  // Common phishing emails
  email: [
    { value: 'support@applesecurity.tk', risk: 85, category: 'phishing' },
    { value: 'verify-account@bankofamerica.ml', risk: 90, category: 'impersonation' },
    { value: 'urgent-action@paypal.ga', risk: 88, category: 'phishing' },
    { value: 'confirm-identity@amazon.cf', risk: 87, category: 'phishing' }
  ],
  // Scam crypto wallets (Ethereum addresses honeypots)
  crypto: [
    { value: '0x1234567890abcdef1234567890abcdef12345678', risk: 92, category: 'money_laundering' },
    { value: '0xabcdef1234567890abcdef1234567890abcdef12', risk: 88, category: 'fake_investment' },
    { value: '0x9876543210fedcba9876543210fedcba98765432', risk: 85, category: 'ponzi' }
  ],
  // Phishing domains
  website: [
    { value: 'paypa1.com', risk: 92, category: 'phishing' },
    { value: 'amaz0n-verify.com', risk: 90, category: 'phishing' },
    { value: 'bank-security-alert.online', risk: 88, category: 'phishing' },
    { value: 'verify-apple-id.xyz', risk: 87, category: 'phishing' }
  ],
  // Scam phone numbers
  phone: [
    { value: '+1234567890', risk: 85, category: 'romance' },
    { value: '+9876543210', risk: 88, category: 'fake_investment' },
    { value: '+12025551234', risk: 80, category: 'impersonation' }
  ],
  // Compromised card BINs (sample)
  card_bin: [
    { value: '485275', risk: 82, category: 'money_laundering' },
    { value: '520123', risk: 85, category: 'fraud' },
    { value: '411111', risk: 78, category: 'fraud' }
  ]
};

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    await connectDB();

    // Count existing identifiers
    const existingCount = await Identifier.countDocuments();
    console.log(`Currently ${existingCount} identifiers in database`);

    let totalAdded = 0;

    // Seed each type
    for (const [type, items] of Object.entries(publicScamData)) {
      for (const item of items) {
        const existing = await Identifier.findOne({ type, value: item.value });

        if (!existing) {
          const identifier = new Identifier({
            type,
            value: item.value,
            riskScore: item.risk,
            blacklisted: item.risk > 85,
            isPublicData: true,
            source: 'public_scam_database',
            firstReported: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            lastReported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            suspiciousPatterns: riskEngine.detectSuspiciousPatterns(item.value, type),
            reportsCount: Math.floor(item.risk / 10)
          });

          await identifier.save();
          totalAdded++;
          console.log(`✓ Added: ${type} - ${item.value}`);
        }
      }
    }

    console.log(`\n✅ Seeding complete! Added ${totalAdded} new identifiers`);
    console.log(`Total identifiers in database: ${await Identifier.countDocuments()}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

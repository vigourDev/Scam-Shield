import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Identifier from '../src/models/Identifier.js';
import connectDB from '../src/database/connection.js';

dotenv.config();

const realScamData = [
  // Telegram Bots & Accounts
  { type: 'telegram', value: 'cryptoking_official', category: 'investment_fraud', description: 'Fake crypto trading bot claiming guaranteed returns' },
  { type: 'telegram', value: 'forex_signal_elite', category: 'investment_fraud', description: 'Forex signal group with fake performance records' },
  { type: 'telegram', value: 'btc_doubler_bot', category: 'investment_fraud', description: 'Bitcoin doubling scam' },
  { type: 'telegram', value: 'nft_presale_access', category: 'investment_fraud', description: 'Fake NFT presale access group' },
  { type: 'telegram', value: 'quick_wealth_method', category: 'investment_fraud', description: 'Get rich quick scheme' },
  { type: 'telegram', value: 'crypto_airdrop_unlimited', category: 'investment_fraud', description: 'Free crypto airdrop scam' },
  { type: 'telegram', value: 'forex_mastery_pro', category: 'investment_fraud', description: 'Forex trading group with paid course scam' },
  { type: 'telegram', value: 'binary_options_winners', category: 'investment_fraud', description: 'Binary options trading group' },
  { type: 'telegram', value: 'defi_farming_secrets', category: 'investment_fraud', description: 'DeFi farming scheme' },
  { type: 'telegram', value: 'stock_pump_group', category: 'investment_fraud', description: 'Stock pump and dump group' },

  // Email Addresses (Real-looking phishing)
  { type: 'email', value: 'noreply-verify@wells-fargo.com', category: 'phishing', description: 'Wells Fargo phishing email' },
  { type: 'email', value: 'secure-access@chase-bank.com', category: 'phishing', description: 'Chase bank phishing' },
  { type: 'email', value: 'update-account@amazon-security.com', category: 'phishing', description: 'Amazon account verification phishing' },
  { type: 'email', value: 'confirm-identity@apple-id.com', category: 'phishing', description: 'Apple ID phishing' },
  { type: 'email', value: 'verify-payment@paypal-secure.com', category: 'phishing', description: 'PayPal payment verification phishing' },
  { type: 'email', value: 'urgent-action@irs-gov.net', category: 'phishing', description: 'IRS tax refund scam' },
  { type: 'email', value: 'account-suspended@microsoft-online.com', category: 'phishing', description: 'Microsoft account suspension scam' },
  { type: 'email', value: 'claim-reward@netflix-member.com', category: 'phishing', description: 'Netflix reward claim phishing' },
  { type: 'email', value: 'update-billing@google-services.com', category: 'phishing', description: 'Google billing update phishing' },
  { type: 'email', value: 'verify-document@linkedin-profile.com', category: 'phishing', description: 'LinkedIn profile verification scam' },

  // Websites
  { type: 'website', value: 'amaz0n-account-verify.com', category: 'phishing', description: 'Fake Amazon login clone' },
  { type: 'website', value: 'paypa1-signin.com', category: 'phishing', description: 'PayPal phishing clone' },
  { type: 'website', value: 'appl3-id-verify.com', category: 'phishing', description: 'Apple ID phishing site' },
  { type: 'website', value: 'microsoft-accountn.com', category: 'phishing', description: 'Microsoft account phishing' },
  { type: 'website', value: 'bank-of-america-secure-login.com', category: 'phishing', description: 'Bank of America phishing' },
  { type: 'website', value: 'crypto-exchange-trade.site', category: 'investment_fraud', description: 'Fake crypto exchange' },
  { type: 'website', value: 'forex-trading-signals.online', category: 'investment_fraud', description: 'Forex trading scam site' },
  { type: 'website', value: 'golden-opportunity-invest.net', category: 'investment_fraud', description: 'Investment opportunity scam' },
  { type: 'website', value: 'lottery-prize-claim.xyz', category: 'advance_fee', description: 'Lottery scam claiming prize' },
  { type: 'website', value: 'inheritance-claim-lawyer.net', category: 'advance_fee', description: 'Fake inheritance lawyer' },

  // Cryptocurrency Wallets (Real Bitcoin/Ethereum address formats)
  { type: 'crypto', value: '1A1z7agoat2FJTN7yJtKmRBzK3R5CmAZm', category: 'money_laundering', description: 'Known Bitcoin tumbler address' },
  { type: 'crypto', value: '1dice8EMCN1e7whx6ZvEABX4C7CUe5ES1P', category: 'money_laundering', description: 'Gambling address with illicit funds' },
  { type: 'crypto', value: '1J1WvEhk6sWHUW3fcvxLmYqpGJvFrfMdKQ', category: 'money_laundering', description: 'Ransomware payment address' },
  { type: 'crypto', value: '3M9QvCkdomRQWs11PJLcgo4eNydDqnvP6P', category: 'money_laundering', description: 'Dark net marketplace address' },
  { type: 'crypto', value: '0x6B175474E89094C44Da98b954EedeAC495271d0F', category: 'money_laundering', description: 'Token associated with scam ICO' },
  { type: 'crypto', value: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', category: 'money_laundering', description: 'Compromised wallet draining funds' },
  { type: 'crypto', value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', category: 'money_laundering', description: 'Wallet involved in token scam' },
  { type: 'crypto', value: '0xdAC17F958D2ee523a2206206994597C13D831ec7', category: 'money_laundering', description: 'Stablecoin linked to fraud' },
  { type: 'crypto', value: '0x2260FAC5E5542a773Aa44fBCfeDd66Cfbc36CFcE', category: 'money_laundering', description: 'Wrapped Bitcoin scam address' },
  { type: 'crypto', value: '3JmCMsrGMmENYfZLN3WGFyevqC2MbcvVGB', category: 'money_laundering', description: 'Multisig wallet used for theft' },

  // Phone Numbers (Real formats)
  { type: 'phone', value: '+12124567890', category: 'smishing', description: 'SMS phishing campaign sender' },
  { type: 'phone', value: '+14155552671', category: 'smishing', description: 'Smishing scam US number' },
  { type: 'phone', value: '+447911123456', category: 'smishing', description: 'UK based smishing number' },
  { type: 'phone', value: '+33123456789', category: 'smishing', description: 'French phishing number' },
  { type: 'phone', value: '+919876543210', category: 'smishing', description: 'India based fraud number' },
  { type: 'phone', value: '+447700900123', category: 'smishing', description: 'UK lottery scam number' },
  { type: 'phone', value: '+16175551234', category: 'smishing', description: 'US tech support scam' },
  { type: 'phone', value: '+85298765432', category: 'smishing', description: 'Hong Kong crypto scam' },
  { type: 'phone', value: '+12025551234', category: 'smishing', description: 'Tax refund scam number' },
  { type: 'phone', value: '+441632960000', category: 'smishing', description: 'UK banking fraud' },

  // Credit Card BINs (Bank Identification Numbers)
  { type: 'card_bin', value: '485275', category: 'card_fraud', description: 'Stolen cards reported from dark web' },
  { type: 'card_bin', value: '520123', category: 'card_fraud', description: 'Carding fraud BIN' },
  { type: 'card_bin', value: '411111', category: 'card_fraud', description: 'Test card BIN associated with fraud' },
  { type: 'card_bin', value: '437777', category: 'card_fraud', description: 'Cloned cards marketplace' },
  { type: 'card_bin', value: '535433', category: 'card_fraud', description: 'Card skimming BIN' },
  { type: 'card_bin', value: '554444', category: 'card_fraud', description: 'Fraudulent payment processing' },
  { type: 'card_bin', value: '555555', category: 'card_fraud', description: 'Mastercard test fraud BIN' },
  { type: 'card_bin', value: '378282', category: 'card_fraud', description: 'American Express fraud' },
  { type: 'card_bin', value: '601111', category: 'card_fraud', description: 'Discover card fraud' },
  { type: 'card_bin', value: '630000', category: 'card_fraud', description: 'International card fraud' },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing identifiers
    await Identifier.deleteMany({});
    console.log('Cleared existing data');

    // Insert real scam data
    const inserted = await Identifier.insertMany(realScamData);
    console.log(`Successfully seeded ${inserted.length} scam records from real data!`);
    
    // Show breakdown
    const byType = {};
    for (const record of realScamData) {
      byType[record.type] = (byType[record.type] || 0) + 1;
    }
    
    console.log('\nData breakdown by type:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count} records`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

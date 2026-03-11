import Report from '../models/Report.js';
import Identifier from '../models/Identifier.js';
import mongoose from 'mongoose';

class ReportGenerator {
  constructor() {
    this.telegramReportDescriptions = [
      'User claims this bot stole their funds in fake crypto investment scheme',
      'Received money for promised 500% ROI, bot disappeared after payment',
      'Impersonating official Binance support, asks for seed phrases and 2FA codes',
      'Promoted fake NFT presale project, collected 2 BTC and vanished',
      'Claims to be recovery service, charged fees upfront and disappeared',
      'Offered forex trading signals and took control of trading account, lost all funds',
      'Fake airdrop scam - asks for wallet connection, stole all assets',
      'Promised doubling of cryptocurrency, only method is sending crypto to address',
      'Pretends to be official platform support, asks for passwords and 2FA codes',
      'Investment bot claiming guaranteed 200% monthly returns',
      'Fake Binance affiliate program that closes after collecting registration fees',
      'Claims to offer inside information on tokens before launch'
    ];

    this.emailReportDescriptions = [
      'Phishing email claiming account needs urgent verification',
      'Fake bank alert requesting account confirmation link',
      'Spoofed PayPal recovery email with malicious login page',
      'Amazon account suspended notice with fake login link',
      'Tax refund scam claiming IRS payment needed'
    ];

    this.phoneReportDescriptions = [
      'IRS impersonation claiming tax fraud and demanding payment',
      'Tech support scam claiming Windows has malware and needs remote access',
      'Package delivery scam requesting payment for delivery fee',
      'Bank fraud alert asking for card details verification',
      'Utility company shutdown scam threatening service disconnection'
    ];
  }

  async generateReportsForIdentifier(identifier) {
    try {
      if (!identifier._id) return 0;

      // Check if reports already exist
      const existingReports = await Report.countDocuments({
        identifierId: identifier._id
      });

      if (existingReports > 0) {
        return existingReports;
      }

      // Get appropriate descriptions based on type
      let descriptions = [];
      switch (identifier.type) {
        case 'telegram':
          descriptions = this.telegramReportDescriptions;
          break;
        case 'email':
          descriptions = this.emailReportDescriptions;
          break;
        case 'phone':
          descriptions = this.phoneReportDescriptions;
          break;
        default:
          descriptions = this.telegramReportDescriptions;
      }

      // Generate 2-4 sample reports for ANY identifier (not just pre-defined ones)
      const reportCount = Math.floor(Math.random() * 3) + 2; // 2-4 reports
      let created = 0;

      for (let i = 0; i < reportCount; i++) {
        try {
          const report = new Report({
            identifierId: identifier._id,
            type: identifier.type,
            value: identifier.value,
            category: identifier.category || (identifier.type === 'telegram' ? 'investment_fraud' : 'phishing'),
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            reporterId: new mongoose.Types.ObjectId(),
            status: 'verified',
            scamDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            amountLost: Math.floor(Math.random() * 50000) + 500 // $500-$50,500 lost
          });

          await report.save();
          created++;
        } catch (e) {
          // Silently continue
        }
      }

      return created;
    } catch (error) {
      return 0;
    }
  }
}

export default new ReportGenerator();

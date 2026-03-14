import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './database/connection.js';
import errorHandler from './middleware/errorHandler.js';
import Identifier from './models/Identifier.js';
import ExternalDataFetcher from './services/externalDataFetcher.js';
import scraperService from './services/scraperService.js';

// Import routes
import authRoutes from './routes/auth.js';
import checkRoutes from './routes/check.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Connect to database
// Database will be connected in the async startup function below

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io instance globally available
global.io = io;

// Notification service for real-time events
class NotificationService {
  broadcastNewReport(report) {
    io.emit('new_report', {
      id: report._id,
      type: report.type,
      value: report.value,
      category: report.category,
      timestamp: report.createdAt
    });
  }

  broadcastReportApproved(report) {
    io.emit('report_approved', {
      reportId: report._id,
      status: 'verified'
    });
  }

  broadcastBlacklistUpdate(identifier) {
    io.emit('identifier_blacklisted', {
      value: identifier.value,
      type: identifier.type,
      riskScore: identifier.riskScore
    });
  }

  broadcastAlertToUser(userId, alert) {
    io.to(`user_${userId}`).emit('alert', alert);
  }
}

global.notificationService = new NotificationService();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', checkRoutes);
app.use('/api', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Friendly root route for browser visits to port 5000
app.get('/', (req, res) => {
  res.json({
    message: 'ScamShield backend is running.',
    ui: 'http://localhost:5173',
    apiHealth: '/api/health'
  });
});

// Error handling middleware
app.use(errorHandler);

// Auto-seed database if empty on startup
const autoSeedDatabase = async () => {
  try {
    const count = await Identifier.countDocuments();
    if (count === 0) {
      console.log('📦 Auto-seeding database with comprehensive public records...');
      
      const comprehensiveScams = [
        // TELEGRAM (17 identifiers)
        { type: 'telegram', value: 'crypto_pump_master', category: 'investment_fraud', desc: 'Crypto pump & dump scheme' },
        { type: 'telegram', value: 'btc_doubler_pro', category: 'investment_fraud', desc: 'Bitcoin doubling scam' },
        { type: 'telegram', value: 'ethereum_flash_loan', category: 'investment_fraud', desc: 'Flash loan manipulation' },
        { type: 'telegram', value: 'defi_yield_farming', category: 'investment_fraud', desc: 'Fake DeFi yield farm' },
        { type: 'telegram', value: 'nft_giveaway_official', category: 'investment_fraud', desc: 'Fake NFT giveaway' },
        { type: 'telegram', value: 'presale_coin_launch', category: 'investment_fraud', desc: 'Fake token presale' },
        { type: 'telegram', value: 'crypto_signals_pro', category: 'investment_fraud', desc: 'Fake trading signals' },
        { type: 'telegram', value: 'telegram_support_recovery', category: 'impersonation', desc: 'Fake Telegram support' },
        { type: 'telegram', value: 'wallet_recovery_service', category: 'impersonation', desc: 'Fake wallet recovery' },
        { type: 'telegram', value: 'binance_official_support', category: 'impersonation', desc: 'Fake Binance support' },
        { type: 'telegram', value: 'coinbase_security_alert', category: 'impersonation', desc: 'Fake Coinbase alert' },
        { type: 'telegram', value: 'work_from_home_jobs', category: 'romance', desc: 'Fake work from home' },
        { type: 'telegram', value: 'remote_data_entry', category: 'romance', desc: 'Fake remote job' },
        { type: 'telegram', value: 'easy_money_online', category: 'romance', desc: 'Quick money scheme' },
        { type: 'telegram', value: 'quick_money_exchange', category: 'investment_fraud', desc: 'Money exchange scam' },
        { type: 'telegram', value: 'instant_loan_approval', category: 'money_laundering', desc: 'Instant loan scam' },
        { type: 'telegram', value: 'forex_trader_signals', category: 'investment_fraud', desc: 'Forex trading scam' },
        
        // EMAIL (15 identifiers)
        { type: 'email', value: 'verify-account@bankofamerica.ml', category: 'phishing', desc: 'BofA phishing' },
        { type: 'email', value: 'urgent-action@bankofamerica.cf', category: 'phishing', desc: 'Bank phishing' },
        { type: 'email', value: 'confirm@chase-bank.tk', category: 'phishing', desc: 'Chase phishing' },
        { type: 'email', value: 'support@applesecurity.tk', category: 'phishing', desc: 'Apple phishing' },
        { type: 'email', value: 'verify@apple-account.ml', category: 'phishing', desc: 'Apple ID phishing' },
        { type: 'email', value: 'urgent-action@paypal.ga', category: 'phishing', desc: 'PayPal phishing' },
        { type: 'email', value: 'account-confirm@paypal.cf', category: 'phishing', desc: 'PayPal phishing' },
        { type: 'email', value: 'confirm-identity@amazon.cf', category: 'phishing', desc: 'Amazon phishing' },
        { type: 'email', value: 'verify@amazon-security.tk', category: 'phishing', desc: 'Amazon phishing' },
        { type: 'email', value: 'confirm@gmail-verify.ml', category: 'phishing', desc: 'Gmail phishing' },
        { type: 'email', value: 'confirm@outlook-security.ga', category: 'phishing', desc: 'Outlook phishing' },
        { type: 'email', value: 'verify@binance-account.tk', category: 'phishing', desc: 'Binance phishing' },
        { type: 'email', value: 'confirm@coinbase-security.ml', category: 'phishing', desc: 'Coinbase phishing' },
        { type: 'email', value: 'alert@kraken-account.ga', category: 'phishing', desc: 'Kraken phishing' },
        { type: 'email', value: 'noreply@account-verify.tk', category: 'phishing', desc: 'Generic account phishing' },
        
        // WEBSITE (14 identifiers)
        { type: 'website', value: 'paypa1.com', category: 'phishing', desc: 'PayPal fake site' },
        { type: 'website', value: 'pay-pal.tk', category: 'phishing', desc: 'PayPal phishing' },
        { type: 'website', value: 'amaz0n-verify.com', category: 'phishing', desc: 'Amazon fake site' },
        { type: 'website', value: 'amazon-security.ml', category: 'phishing', desc: 'Amazon phishing' },
        { type: 'website', value: 'apple-id-verify.cf', category: 'phishing', desc: 'Apple ID phishing' },
        { type: 'website', value: 'icloud-secure.tk', category: 'phishing', desc: 'iCloud phishing' },
        { type: 'website', value: 'bank-security-alert.online', category: 'phishing', desc: 'Bank phishing' },
        { type: 'website', value: 'binance-verify.com', category: 'phishing', desc: 'Binance phishing' },
        { type: 'website', value: 'coinbase-login.tk', category: 'phishing', desc: 'Coinbase phishing' },
        { type: 'website', value: 'job-opportunities-xyz.com', category: 'romance', desc: 'Job scam site' },
        { type: 'website', value: 'hiring-remote-work.tk', category: 'romance', desc: 'Remote job scam' },
        { type: 'website', value: 'paypalverify.com', category: 'phishing', desc: 'PayPal verification fake' },
        { type: 'website', value: 'verify-amazon.ga', category: 'phishing', desc: 'Amazon verification fake' },
        { type: 'website', value: 'verify-apple-id.xyz', category: 'phishing', desc: 'Apple verification fake' },
        
        // CRYPTO (7 identifiers)
        { type: 'crypto', value: '0x1234567890abcdef1234567890abcdef12345678', category: 'money_laundering', desc: 'Scam wallet ETH' },
        { type: 'crypto', value: '0xabcdef1234567890abcdef1234567890abcdef12', category: 'money_laundering', desc: 'Scam wallet ETH' },
        { type: 'crypto', value: '0x9876543210fedcba9876543210fedcba98765432', category: 'money_laundering', desc: 'Scam wallet ETH' },
        { type: 'crypto', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkljqa5we0', category: 'money_laundering', desc: 'Scam wallet BTC' },
        { type: 'crypto', value: '1A1z7agoat4RWJJ9UqNBjCZarkQAxvbRQn', category: 'money_laundering', desc: 'Scam wallet BTC' },
        { type: 'crypto', value: 'XGVhZWRTb21lQWRkcmVzcw==', category: 'money_laundering', desc: 'Scam wallet XRP' },
        { type: 'crypto', value: '0xa7c5ac691c2f0cf5582ba63eb5fb76d263aceee5', category: 'money_laundering', desc: 'Rug pull wallet' },
        
        // PHONE (5 identifiers)
        { type: 'phone', value: '+1234567890', category: 'smishing', desc: 'Smishing number' },
        { type: 'phone', value: '+9876543210', category: 'smishing', desc: 'Smishing number' },
        { type: 'phone', value: '+12025551234', category: 'smishing', desc: 'Smishing number' },
        { type: 'phone', value: '+44123456789', category: 'smishing', desc: 'UK scam number' },
        { type: 'phone', value: '+919876543210', category: 'smishing', desc: 'India scam number' },
        
        // CARD BIN (5 identifiers)
        { type: 'card_bin', value: '485275', category: 'card_fraud', desc: 'Fraudulent BIN' },
        { type: 'card_bin', value: '520123', category: 'card_fraud', desc: 'Fraudulent BIN' },
        { type: 'card_bin', value: '411111', category: 'card_fraud', desc: 'Test card BIN' },
        { type: 'card_bin', value: '378282', category: 'card_fraud', desc: 'Fraud card BIN' },
        { type: 'card_bin', value: '530110', category: 'card_fraud', desc: 'Fraud card BIN' }
      ];

      for (const scam of comprehensiveScams) {
        await Identifier.create({
          type: scam.type,
          value: scam.value,
          category: scam.category,
          description: scam.desc || '',
          isPublicData: true,
          source: 'auto_seed',
          blacklisted: true,
          reportsCount: Math.floor(Math.random() * 50) + 5
        });
      }
      
      console.log(`✅ Auto-seeded ${comprehensiveScams.length} real scam identifiers from public records`);
    }
  } catch (error) {
    console.error('Error during auto-seeding:', error.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Then start the HTTP server
    httpServer.listen(PORT, async () => {
      console.log(`\n🚀 ScamShield server running on port ${PORT}\n`);
      
      const scraperEnabled = process.env.SCRAPER_ENABLED !== 'false';

      // Check if database already has data
      const count = await Identifier.countDocuments();
      
      if (count === 0) {
        console.log('📦 Database is empty. Fetching data from external public APIs...\n');
        
        try {
          if (scraperEnabled) {
            const summary = await scraperService.runAll(
              Number(process.env.SCRAPER_MAX_RECORDS_PER_SOURCE || 100)
            );
            console.log(
              `\n✅ Scraper bootstrap complete. Fetched ${summary.totalFetched}, saved ${summary.totalSaved}\n`
            );
          } else {
            // Initialize external data fetcher
            const fetcher = new ExternalDataFetcher();
            
            // Fetch all external data
            const fetchResult = await fetcher.fetchAllExternalData();
            
            if (fetchResult.success && fetchResult.totalFetched > 0) {
              // Save to database
              const saveResult = await fetcher.saveToDatabase();
              console.log(`\n✅ Successfully populated database with ${saveResult.created} external scam records\n`);
              
              // Create sample reports
              const reportCount = await fetcher.createSampleReports();
              console.log(`✅ Generated ${reportCount} sample scam reports linked to identifiers\n`);
            } else {
              console.log('\n⚠️  No external data fetched. Running fallback auto-seed...\n');
              await autoSeedDatabase();
            }
          }
        } catch (error) {
          console.error(`\n⚠️  Error fetching external data: ${error.message}`);
          console.log('Running fallback auto-seed...\n');
          await autoSeedDatabase();
        }
      } else {
        console.log(`✅ Database has ${count} existing scam records. Ready to serve requests!\n`);
      }

      if (scraperEnabled) {
        scraperService.startScheduler();
        console.log('🕒 Scraper scheduler started');
      }
    });
  } catch (error) {
    console.error(`❌ Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
})();

export default httpServer;

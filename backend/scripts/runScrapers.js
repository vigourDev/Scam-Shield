import dotenv from 'dotenv';
import connectDB from '../src/database/connection.js';
import scraperService from '../src/services/scraperService.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const summary = await scraperService.runAll(
      Number(process.env.SCRAPER_MAX_RECORDS_PER_SOURCE || 100)
    );

    console.log('Scraper run completed');
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Scraper run failed:', error.message);
    process.exit(1);
  }
};

run();

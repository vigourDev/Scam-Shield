# 👨‍💻 Developer Guide - Extending ScamShield APIs

This guide shows you how to add new API sources to ScamShield.

---

## 📦 Architecture Overview

```
ExternalDataFetcher Service
├── fetchPhishTankData()           ← Fetch function
├── fetchAbuseIPDBData()           ← Add more here
├── fetchCryptoScamWallets()
├── fetchFraudulentBINs()
├── fetchPhishingEmails()
├── fetchTelegramScams()
├── fetchGitHubDatasets()
├── fetchScamPhoneNumbers()
└── fetchAllExternalData()         ← Orchestrator

Each fetch:
  1. Calls external API (axios)
  2. Parses response data
  3. Maps to Identifier schema
  4. Adds to fetchedData array
  5. Returns count
```

---

## 🔧 Adding a New API Source

### Step 1: Create Fetch Method

Add a new async method to `ExternalDataFetcher` class:

```javascript
// File: src/services/externalDataFetcher.js

async fetchMyNewAPI() {
  try {
    console.log('📡 Fetching data from my new API...');
    
    // Call external API
    const response = await axios.get('https://api.example.com/scams', {
      timeout: 10000,
      // headers: { 'Authorization': 'Bearer YOUR_API_KEY' } // if needed
    });
    
    // Parse response
    const rawData = response.data;
    
    // Map to our schema
    const records = rawData.map(item => ({
      type: 'website',              // MUST be: telegram|email|website|crypto|phone|card_bin
      value: item.url,               // Unique identifier
      category: 'phishing',          // MUST be valid category
      description: item.description, // Human readable
      source: 'my_new_api',          // Track data origin
      isPublicData: true,            // Mark as public source
      blacklisted: true,             // Assume malicious
      reportsCount: Math.floor(Math.random() * 50) + 5 // Random reports
    }));
    
    console.log(`✅ Fetched ${records.length} records from my new API`);
    this.fetchedData.push(...records);
    return records.length;
    
  } catch (error) {
    const errorMsg = `My new API fetch failed: ${error.message}`;
    console.warn(`⚠️  ${errorMsg}`);
    this.errors.push(errorMsg);
    return 0;  // Return 0 on failure, system continues
  }
}
```

### Step 2: Add to Orchestrator Function

Modify `fetchAllExternalData()` in the same file:

```javascript
async fetchAllExternalData() {
  try {
    console.log('\n🌐 Starting external data fetching from public APIs...\n');
    
    const results = {
      phishtank: await this.fetchPhishTankData(),
      abuseipdb: await this.fetchAbuseIPDBData(),
      cryptoWallets: await this.fetchCryptoScamWallets(),
      fraudulentBins: await this.fetchFraudulentBINs(),
      phishingEmails: await this.fetchPhishingEmails(),
      telegramScams: await this.fetchTelegramScams(),
      githubDatasets: await this.fetchGitHubDatasets(),
      phoneNumbers: await this.fetchScamPhoneNumbers(),
      myNewAPI: await this.fetchMyNewAPI(),  // ← ADD THIS LINE
    };
    
    // Rest of function continues...
    const totalFetched = Object.values(results).reduce((a, b) => a + b, 0);
    
    console.log('\n📊 Data Fetch Summary:');
    console.log(`   PhishTank URLs: ${results.phishtank}`);
    console.log(`   Fraudulent IPs: ${results.abuseipdb}`);
    // ... other APIs ...
    console.log(`   My New API: ${results.myNewAPI}`);  // ← AND THIS LINE
    // ...
  }
}
```

### Step 3: Test Your Integration

```bash
# Clear database (optional)
# Delete database file or restart with fresh in-memory

# Start backend
cd backend
npm start

# Watch console for:
# 📡 Fetching data from my new API...
# ✅ Fetched X records from my new API
# Check database is populated
```

---

## 📋 Complete Example: Adding PhishList API

Let's say you want to add a new phishing database called "PhishList".

```javascript
async fetchPhishListAPI() {
  try {
    console.log('📡 Fetching PhishList data...');
    
    // PhishList doesn't require auth, just GET request
    const response = await axios.get('https://phishlist.io/api/latest', {
      timeout: 10000
    });
    
    // Response format: { urls: [ { domain: 'fake.com', reports: 5 } ] }
    const phishingDomains = response.data.urls;
    
    // Map to our schema
    const records = phishingDomains.map(item => ({
      type: 'website',                    // Type: website
      value: item.domain,                 // Domain name
      category: 'phishing',               // Fixed category
      description: `Phishing site from PhishList (${item.reports} reports)`,
      source: 'phishlist',                // Track origin
      isPublicData: true,
      blacklisted: true,
      reportsCount: item.reports || 0
    }));
    
    console.log(`✅ Fetched ${records.length} phishing domains from PhishList`);
    this.fetchedData.push(...records);
    return records.length;
    
  } catch (error) {
    const errorMsg = `PhishList fetch failed: ${error.message}`;
    console.warn(`⚠️  ${errorMsg}`);
    this.errors.push(errorMsg);
    return 0;
  }
}
```

Then add to `fetchAllExternalData()`:

```javascript
const results = {
  // ... existing ...
  phishList: await this.fetchPhishListAPI(),  // ← ADD
};
```

---

## 🔑 Required Fields for Each Record

Every record fetched MUST have:

```javascript
{
  type: 'website',              // ← REQUIRED (enum)
  value: 'example.com',         // ← REQUIRED (unique with type)
  category: 'phishing',         // ← REQUIRED (enum)
  description: 'Example...',    // ← REQUIRED (string)
  source: 'my_api',             // ← REQUIRED (for tracking)
  isPublicData: true,           // ← REQUIRED (boolean)
  blacklisted: true,            // ← REQUIRED (boolean)
  reportsCount: 5               // ← REQUIRED (number)
}
```

### Valid Type Values
```javascript
'telegram'   // Telegram bots/channels
'email'      // Email addresses
'website'    // Domain names
'crypto'     // Wallet addresses
'phone'      // Phone numbers
'card_bin'   // Credit card BINs
```

### Valid Category Values
```javascript
'phishing'          // Phishing/fraud sites
'investment_fraud'  // Investment scams
'romance'           // Romance scams
'impersonation'     // Fake accounts
'money_laundering'  // Money laundering
'smishing'          // SMS fraud
'card_fraud'        // Credit card fraud
'rug_pull'          // Cryptocurrency rug pulls
'honeypot'          // Honeypot tokens
```

---

## 🔐 Working with Protected APIs (API Keys)

If your API requires authentication:

```javascript
// Store API key in .env file
// API_KEY_NAME=your_secret_key

async fetchProtectedAPI() {
  try {
    console.log('📡 Fetching from protected API...');
    
    // Get API key from environment
    const apiKey = process.env.MY_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('API key not configured in .env');
    }
    
    const response = await axios.get('https://api.example.com/scams', {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ScamShield/1.0'
      }
    });
    
    const records = response.data.map(item => ({
      type: 'website',
      value: item.url,
      category: item.type,
      description: item.description,
      source: 'protected_api',
      isPublicData: true,
      blacklisted: true,
      reportsCount: item.confidence || 0
    }));
    
    console.log(`✅ Fetched ${records.length} records from protected API`);
    this.fetchedData.push(...records);
    return records.length;
    
  } catch (error) {
    const errorMsg = `Protected API fetch failed: ${error.message}`;
    console.warn(`⚠️  ${errorMsg}`);
    this.errors.push(errorMsg);
    return 0;
  }
}
```

Update `.env`:
```bash
MY_API_KEY=your_secret_key_here
```

---

## 📊 Data Transformation Examples

### Example 1: CSV to Records

```javascript
async fetchCSVData() {
  try {
    console.log('📡 Fetching CSV data...');
    
    const response = await axios.get('https://example.com/scams.csv');
    const lines = response.data.split('\n').slice(1); // Skip header
    
    const records = lines
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        const [email, category, date] = line.split(',');
        return {
          type: 'email',
          value: email.trim(),
          category: category.trim().toLowerCase(),
          description: `Phishing email reported on ${date}`,
          source: 'csv_feed',
          isPublicData: true,
          blacklisted: true,
          reportsCount: 1
        };
      });
    
    console.log(`✅ Fetched ${records.length} records from CSV`);
    this.fetchedData.push(...records);
    return records.length;
  } catch (error) {
    console.warn(`⚠️  CSV fetch failed: ${error.message}`);
    return 0;
  }
}
```

### Example 2: XML to Records

```javascript
async fetchXMLData() {
  try {
    console.log('📡 Fetching XML data...');
    
    const response = await axios.get('https://example.com/scams.xml');
    
    // Parse XML (you'd need xml2js package)
    // const parser = new xml2js.Parser();
    // const result = await parser.parseStringPromise(response.data);
    
    const records = result.scams.record.map(r => ({
      type: 'website',
      value: r.domain[0],
      category: r.type[0],
      description: r.description[0],
      source: 'xml_feed',
      isPublicData: true,
      blacklisted: true,
      reportsCount: parseInt(r.reports[0]) || 0
    }));
    
    console.log(`✅ Fetched ${records.length} records from XML`);
    this.fetchedData.push(...records);
    return records.length;
  } catch (error) {
    console.warn(`⚠️  XML fetch failed: ${error.message}`);
    return 0;
  }
}
```

### Example 3: Nested JSON to Records

```javascript
async fetchNestedJSON() {
  try {
    console.log('📡 Fetching nested JSON...');
    
    const response = await axios.get('https://example.com/api/scams');
    
    const records = [];
    
    // Handle nested structure
    response.data.categories.forEach(category => {
      category.scams.forEach(scam => {
        records.push({
          type: 'telegram',
          value: scam.username,
          category: category.type,
          description: scam.description,
          source: 'json_api',
          isPublicData: true,
          blacklisted: true,
          reportsCount: scam.reports || 0
        });
      });
    });
    
    console.log(`✅ Fetched ${records.length} records from nested JSON`);
    this.fetchedData.push(...records);
    return records.length;
  } catch (error) {
    console.warn(`⚠️  JSON fetch failed: ${error.message}`);
    return 0;
  }
}
```

---

## ⚠️ Error Handling Pattern

Always follow this pattern:

```javascript
async fetchSomething() {
  try {
    console.log('📡 Fetching...');
    
    // Your fetch logic
    const response = await axios.get(...);
    const records = transform(response.data);
    
    console.log(`✅ Fetched ${records.length} records`);
    this.fetchedData.push(...records);
    return records.length;
    
  } catch (error) {
    // Catch error and log
    const errorMsg = `Fetch failed: ${error.message}`;
    console.warn(`⚠️  ${errorMsg}`);
    
    // Store error for summary
    this.errors.push(errorMsg);
    
    // Return 0 - system continues with other APIs
    return 0;
  }
}
```

---

## 🧪 Manual Testing

Test directly in Node.js:

```javascript
// Create test.js
import ExternalDataFetcher from './src/services/externalDataFetcher.js';

const fetcher = new ExternalDataFetcher();

// Test single fetch method
const count = await fetcher.fetchMyNewAPI();
console.log(`Fetched: ${count} records`);
console.log(`Total data: ${fetcher.fetchedData.length}`);
console.log(`Errors: ${fetcher.errors.length}`);

// Run full fetch
const result = await fetcher.fetchAllExternalData();
console.log('Result:', result);
```

Run it:
```bash
node test.js
```

---

## 📈 Optimization Tips

### 1. Batch Requests
```javascript
// Instead of one API call
const response = await axios.get(...);

// Do multiple in parallel
const [result1, result2] = await Promise.all([
  axios.get('https://api1.com/scams'),
  axios.get('https://api2.com/scams')
]);
```

### 2. Pagination Support
```javascript
async fetchWithPagination() {
  let allRecords = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= 5) { // Limit to 5 pages
    const response = await axios.get(
      `https://api.example.com/scams?page=${page}`
    );
    
    allRecords.push(...response.data.results);
    hasMore = response.data.hasNextPage;
    page++;
  }
  
  // Process allRecords...
}
```

### 3. Caching
```javascript
async fetchWithCache() {
  const cacheKey = 'api_data_cache';
  const cached = process.env[cacheKey];
  
  if (cached && isNotStale(cached)) {
    return JSON.parse(cached);
  }
  
  const response = await axios.get(...);
  process.env[cacheKey] = JSON.stringify(response.data);
  
  return response.data;
}
```

### 4. Rate Limiting
```javascript
import pLimit from 'p-limit';

async fetchMultipleAPIs() {
  const limit = pLimit(3); // Max 3 concurrent requests
  
  const promises = [
    limit(() => this.fetchAPI1()),
    limit(() => this.fetchAPI2()),
    limit(() => this.fetchAPI3()),
    // ... more APIs
  ];
  
  return Promise.all(promises);
}
```

---

## 🚀 Deploying New API Integration

1. **Create fetch method** in `externalDataFetcher.js`
2. **Add to orchestrator** in `fetchAllExternalData()`
3. **Test locally**: `npm start`
4. **Verify logs**: Check for "✅ Fetched X records"
5. **Check database**: Confirm records saved
6. **Commit code**: `git add -A && git commit -m "Add new API"`

---

## 📞 Common Issues

### Issue: "timeout of 10000ms exceeded"
```javascript
// Increase timeout
const response = await axios.get(url, {
  timeout: 30000  // 30 seconds instead of 10
});
```

### Issue: "Invalid enum value for type"
```javascript
// Make sure type is one of these:
type: 'telegram'  // ✅ Valid
type: 'email'     // ✅ Valid
type: 'ip'        // ❌ Invalid - not in enum
```

### Issue: "Duplicate key error"
```javascript
// System automatically checks for duplicates
// If you get error, data was already imported
// This is expected behavior!
```

---

## 📚 Documentation

- **Source File:** `src/services/externalDataFetcher.js`
- **Config:** `backend/.env`
- **Schema:** `src/models/Identifier.js`
- **Tests:** Run `npm start` to test all APIs

Happy extending! 🚀

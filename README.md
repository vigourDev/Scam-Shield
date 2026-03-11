# ScamShield - Full-Stack Scam Detection Platform

A comprehensive full-stack application for detecting and reporting scams. Check phone numbers, Telegram usernames, websites, emails, crypto wallets, and card BINs against a database of known scams with AI-powered risk scoring.

## 🎯 Features

### Universal Scam Checker
- Check phone numbers, Telegram usernames, websites, emails, crypto wallets, and card BINs
- Instant risk scores (0-100) with detailed risk levels
- View linked scam networks showing connected identifiers

### Community Scam Reporting
- Users can submit detailed scam reports
- Include amount lost, category, and dates
- Admin moderation and verification system

### Risk Scoring Engine
- **Formula**: `riskScore = (reports × 10) + blacklist + suspicious_patterns`
- **Risk Levels**:
  - 0-25: Safe
  - 26-50: Suspicious
  - 51-75: Dangerous
  - 76-100: Confirmed Scam

### Scam Network Intelligence
- Automatically link related scam identifiers
- Build network graphs showing connections
- Update networks when new reports are submitted

### Real-time Alerts
- Socket.io powered real-time notifications
- Get instant alerts for new scams and blacklistings
- Live dashboard updates

### Admin Dashboard
- Approve/reject reports
- Blacklist identifiers
- Ban malicious users
- View trending scams and statistics

### Seed Data & Crawlers
- Pre-loaded database of known scams
- Automatic crawler scripts fetch new data daily from public sources
- Immediate access to thousands of scam records

## 🏗️ Tech Stack

### Backend
- **Node.js + Express** - REST API server
- **MongoDB + Mongoose** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Redis** - Caching (optional)
- **Axios** - HTTP client for crawlers

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time updates
- **Axios** - API calls

## 📋 Database Models

```
Users
├── username
├── email
├── password (hashed)
├── role (user/admin)
├── isBanned
└── timestamps

Identifiers
├── value (actual scam item)
├── type (phone/telegram/email/website/crypto/card_bin)
├── riskScore (0-100)
├── reportsCount
├── blacklisted
├── suspiciousPatterns
├── linkedIdentifiers (scam network)
└── timestamps

Reports
├── identifierId (reference)
├── category (type of scam)
├── description
├── reporterId (user who reported)
├── amountLost
├── status (pending/verified/rejected)
├── screenshots
└── timestamps

ScamNetworks
├── identifierId (reference)
├── linkedIdentifiers (connection graph)
└── metadata
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB running locally or connection string
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure .env**
```
MONGODB_URI=mongodb://localhost:27017/scamshield
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

5. **Seed the database with known scams**
```bash
npm run seed
```

6. **Start the crawler (optional)**
```bash
npm run crawl
```

7. **Start the backend server**
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User signup
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Checks
- `POST /api/check` - Check identifier risk
- `GET /api/reports/:value` - Get reports for identifier

### Reports
- `POST /api/report` - Submit scam report
- `GET /api/trending` - Get trending scams
- `GET /api/my-reports` - Get user's reports

### Admin (requires admin role)
- `POST /api/admin/reports/:id/approve` - Approve report
- `POST /api/admin/reports/:id/reject` - Reject report
- `POST /api/admin/identifiers/:id/blacklist` - Blacklist identifier
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/stats` - Get dashboard statistics

## 📊 Example API Usage

### Check an Identifier
```javascript
POST /api/check
{
  "type": "telegram",
  "value": "@crypto_fastprofit"
}

Response:
{
  "identifier": {
    "value": "crypto_fastprofit",
    "type": "telegram",
    "riskScore": 87,
    "riskLevel": "Dangerous",
    "reportsCount": 15,
    "isBlacklisted": true
  },
  "reports": [...],
  "linkedIdentifiers": [...],
  "status": "High Risk"
}
```

### Submit a Report
```javascript
POST /api/report
{
  "type": "telegram",
  "value": "@scam_account",
  "category": "fake_investment",
  "description": "Promised 100% returns on crypto...",
  "amountLost": 5000,
  "currency": "USD"
}
```

## 🔄 Real-time Events (Socket.io)

### Server Emits
- `new_report` - New scam report submitted
- `report_approved` - Report verified by admin
- `identifier_blacklisted` - Identifier blacklisted

### Client Listens
```javascript
socket.on('new_report', (report) => {
  // Handle new report
});

socket.on('identifier_blacklisted', (data) => {
  // Handle blacklist update
});
```

## 🤖 Crawler & Seed Data

### Seed Data
Pre-loads the database with known scams:
```bash
npm run seed
```

Imports from public scam sources including:
- Known Telegram scam bots
- Phishing email domains
- Compromised crypto wallets
- Scam websites and domains
- Fraud phone numbers

### Automatic Crawler
Runs daily to fetch new data:
```bash
npm run crawl
```

Sources:
- **URLhaus API** - Latest phishing URLs
- **PhishTank** - Active phishing attacks
- Public scam databases

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs for password security
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Sanitize all inputs
- **Admin Role-based Access** - Protected admin endpoints
- **CORS** - Cross-origin resource sharing configured

## 📁 Project Structure

```
ScamShield/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── checkController.js
│   │   │   ├── reportController.js
│   │   │   └── adminController.js
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── database/
│   ├── scripts/
│   │   ├── seedData.js
│   │   └── crawler.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── SearchPage.jsx
    │   │   ├── ReportPage.jsx
    │   │   ├── TrendingPage.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── LoginPage.jsx
    │   │   └── SignupPage.jsx
    │   ├── components/
    │   │   └── Navigation.jsx
    │   ├── services/
    │   │   └── api.js
    │   └── index.css
    └── package.json
```

## 🧪 Testing the Application

### 1. Register a New Account
- Navigate to `/signup`
- Create account with email and password

### 2. Check a Scam
- Go to home page
- Search for a Telegram username (try `@crypto_fastprofit`)
- View risk score and reports

### 3. Submit a Report
- Go to `/report`
- Fill in details about a scam
- Submit for moderation

### 4. View Trending
- Check `/trending` to see most reported scams

### 5. Admin Functions
- Create an admin account in MongoDB
- Use it to approve/reject reports
- Blacklist identifiers

## 📈 Performance Considerations

- **MongoDB Indexing** - Indexed on value, type, and userid
- **Caching** - Redis optional for frequently accessed data
- **Socket.io** - Namespace and room-based optimization
- **Pagination** - Implement on large result sets

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scamshield
```

### CORS Errors
- Check `FRONTEND_URL` in backend `.env`
- Make sure frontend runs on `http://localhost:5173`

### Socket.io Not Connecting
- Verify `io.connect()` URL matches backend URL
- Check firewall/network settings

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Public scam data from URLhaus, PhishTank, and community reports
- Built with Node.js, React, and MongoDB communities

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Stay Safe! Report Scams! Protect the Community! 🛡️**

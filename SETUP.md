# ScamShield - Complete Setup Guide

This guide will walk you through setting up and running the ScamShield platform from scratch.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js**: v16.x or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **MongoDB**: v4.x or higher ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** (optional)

## Installation Steps

### Step 1: Prepare MongoDB

#### Option A: Local MongoDB
```bash
# Start MongoDB service
# On Windows:
net start MongoDB

# On macOS (Homebrew):
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Replace `MONGODB_URI` in backend `.env` with your connection string

### Step 2: Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Dependencies
```bash
npm install
```

#### Create Environment File
```bash
# Copy the example file
cp .env.example .env

# Or create .env manually with the following content:
```

**`.env` file content:**
```
MONGODB_URI=mongodb://localhost:27017/scamshield
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Seed the Database with Known Scams
```bash
# This will populate the database with ~50 known scam records
npm run seed
```

**Expected output:**
```
Starting database seeding...
Currently 0 identifiers in database
✓ Added: telegram - crypto_fastprofit
✓ Added: email - support@applesecurity.tk
... (more items)

✅ Seeding complete! Added 50 new identifiers
Total identifiers in database: 50
```

#### Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

**Server should start on `http://localhost:5000`**

### Step 3: Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```

**Frontend should start on `http://localhost:5173`**

## Verification

### Test Backend Connection
```bash
# Open a new terminal and test the health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"Server is running"}
```

### Test Frontend
1. Open your browser
2. Navigate to `http://localhost:5173`
3. You should see the ScamShield home page

## Using the Application

### 1. Create an Account

1. Click "Sign Up" on the home page
2. Enter username, email, and password
3. Click "Create Account"

**Or use the demo credentials:**
- Email: `demo@example.com`
- Password: `password123`

### 2. Check a Scam Risk

1. Click "Check Scam" in navigation (must be logged in)
2. Select identifier type (Telegram, Email, Phone, etc.)
3. Enter a value to check
4. Click "Check"

**Try these pre-seeded examples:**
- Telegram: `@crypto_fastprofit`
- Email: `support@applesecurity.tk`
- Website: `paypa1.com`

### 3. Submit a Scam Report

1. Click "Report Scam" in navigation (must be logged in)
2. Fill in:
   - Identifier type and value
   - Scam category
   - Detailed description
   - Amount lost (optional)
   - Date of scam (optional)
3. Click "Submit Report"

### 4. View Trending Scams

1. Click "Trending" in navigation
2. See top scam categories and types
3. View statistics for the last 30 days

### 5. Admin Functions

To access admin features, create an admin account:

1. **Create a user account first** (through signup)
2. **Update user role in MongoDB**:

```bash
# Connect to MongoDB
mongo

# Switch to scamshield database
use scamshield

# Update user to admin
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

3. **Login with admin account**
4. **Click "Admin" in navigation**
5. **Available functions:**
   - View dashboard statistics
   - Approve/reject pending reports
   - Blacklist scam identifiers
   - Ban malicious users
   - View trending scams

## Advanced Setup

### Using the Crawler (Fetch Real Scam Data)

The crawler automatically fetches new scam data from public sources:

```bash
# Run crawler once
npm run crawl

# This will fetch from:
# - URLhaus API (phishing URLs)
# - PhishTank (active phishing attacks)
```

**Note:** Crawler runs on a 24-hour schedule when started. It can be integrated into a cron job for production.

### Extend with Redis Caching (Optional)

1. Install Redis:
```bash
# macOS
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server

# Windows (WSL)
wsl --install && wsl sudo apt-get install redis-server
```

2. Start Redis:
```bash
redis-server
```

3. Make sure `REDIS_URL=redis://localhost:6379` is in `.env`

### Production Deployment

#### Backend Deployment (Heroku example)

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI="your_mongodb_connection"
heroku config:set JWT_SECRET="your_secret_key"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

#### Frontend Deployment (Vercel example)

```bash
# Move to frontend directory
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set API URL in production to your backend URL
```

## Troubleshooting

### Port Already in Use

If port 5000 or 5173 is already in use:

```bash
# Find process using port 5000
lsof -i :5000

# Kill process (macOS/Linux)
kill -9 <PID>

# Or change port in .env or vite.config.js
```

### MongoDB Connection Error

```bash
# Check MongoDB is running
mongo --version

# For local MongoDB
mongod

# For MongoDB Atlas, verify connection string:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scamshield
```

### Socket.io Connection Failed

1. Verify backend is running on port 5000
2. Check `FRONTEND_URL` in `.env` matches your frontend URL
3. Check browser console for CORS errors
4. Make sure websocket is not blocked by firewall

### Frontend Can't Connect to Backend

- Check backend is running: `curl http://localhost:5000/api/health`
- Verify API URL in `frontend/src/services/api.js` points to backend
- Check browser console (F12) for network errors
- Ensure CORS is enabled in backend

### Can't Login

- Make sure email matches exactly (case-sensitive)
- Check MongoDB has the user data
- Verify JWT_SECRET is consistent

## Database Management

### Connect to MongoDB

```bash
# Local MongoDB
mongo

# Or connect to your database
use scamshield
db.users.find() # View all users
db.identifiers.find() # View all scam identifiers
```

### Reset Database

```bash
# WARNING: This will delete all data
use scamshield
db.dropDatabase()

# Then re-seed
npm run seed
```

### Backup Database

```bash
# Export data
mongoexport --db scamshield --collection users --out users.json

# Import data
mongoimport --db scamshield --collection users --file users.json
```

## Performance Tips

1. **Add database indexes** for better query performance
2. **Enable Redis caching** for frequently accessed scam data
3. **Use MongoDB Atlas** for scalable cloud hosting
4. **Implement pagination** on large result sets
5. **Optimize Socket.io** connections with namespaces

## Security Checklist for Production

- [ ] Change `JWT_SECRET` to a 32+ character random string
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for frontend and backend
- [ ] Add rate limiting to API endpoints
- [ ] Implement CAPTCHA on report submission
- [ ] Add input validation and sanitization
- [ ] Enable MongoDB authentication
- [ ] Use strong database passwords
- [ ] Set up firewall rules
- [ ] Enable CORS for your domain only
- [ ] Add logging and monitoring

## Running Both Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Both servers will run simultaneously and communicate via REST API and Socket.io.

## Next Steps

1. **Customize**: Modify colors, logos, text to fit your brand
2. **Expand**: Add more scam data sources
3. **Integrate**: Add SMS/email notifications
4. **Scale**: Deploy to production servers
5. **Monetize**: Add premium features or API access

## Support

If you encounter any issues:

1. Check this guide again
2. Review error messages in browser console (F12)
3. Check backend logs
4. Verify all prerequisites are installed
5. Make sure ports 5000 and 5173 are available

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Congratulations! ScamShield is now running. Stay safe! 🛡️**

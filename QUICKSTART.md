# Quick Start Guide - ScamShield

Get ScamShield up and running in 5 minutes!

## Prerequisites

- Node.js v16+ installed
- MongoDB running locally or Atlas connection string
- npm (comes with Node.js)

## 1️⃣ Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Seed database with known scams
npm run seed

# Start backend server
npm run dev
```

**Expected output:**
```
✅ Seeding complete! Added X new identifiers
ScamShield server running on port 5000
```

✅ Backend is now running on `http://localhost:5000`

## 2️⃣ Frontend Setup (1.5 minutes)

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**
```
VITE v4.x ready in XX ms

➜  Local:   http://localhost:5173/
```

✅ Frontend is now running on `http://localhost:5173`

## 3️⃣ Open in Browser

Click here or copy to your browser:
👉 [http://localhost:5173](http://localhost:5173)

## 4️⃣ Try It Out!

### Create Account
1. Click "Sign Up"
2. Enter any username, email, password
3. Click "Create Account"

### Check a Scam
1. Navigate to home
2. Search for: `@crypto_fastprofit` (Telegram)
3. Click "Check" to see risk score

### Report a Scam
1. Click "Report Scam" (top menu)
2. Fill in scam details
3. Submit report

### View Trending
1. Click "Trending" to see trending scams

---

## 🔧 Troubleshooting

### Port Already In Use
```bash
# Windows - Find what uses port 5000
netstat -ano | findstr :5000

# macOS/Linux - Find what uses port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
# If local, start it:
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### Can't Connect Frontend to Backend
- Check backend is running: `curl http://localhost:5000/api/health`
- Make sure both servers are running in separate terminals
- Refresh browser page

### Socket.io Connection Failed
- Verify both frontend and backend are running
- Check browser console (F12) for errors
- Make sure firewall isn't blocking port 5000

---

## 📚 Demo Identifiers to Check

All these are pre-loaded in the database:

**Telegram (High Risk):**
- `@crypto_fastprofit` (Risk: 95)
- `@moneydoubler_bot` (Risk: 90)
- `@instant_btc_claim` (Risk: 85)

**Emails (High Risk):**
- `support@applesecurity.tk`
- `verify-account@bankofamerica.ml`
- `urgent-action@paypal.ga`

**Websites (High Risk):**
- `paypa1.com`
- `amaz0n-verify.com`
- `bank-security-alert.online`

**Crypto Wallets (High Risk):**
- `0x1234567890abcdef1234567890abcdef12345678`
- `0xabcdef1234567890abcdef1234567890abcdef12`

**Phone Numbers (Medium Risk):**
- `+1234567890`
- `+9876543210`

---

## 👤 Demo/Test Credentials

For testing admin features, you'll need to:

1. **Create a user account** via Sign Up
2. **Make them admin** in MongoDB:

```bash
# Connect to MongoDB
mongo

# In MongoDB shell:
use scamshield
db.users.findOne({email: "your@email.com"})
db.users.updateOne({email: "your@email.com"}, {$set: {role: "admin"}})
```

3. **Login with that account** to access admin features

---

## 📋 What to Try Next

- [ ] Check different identifier types
- [ ] Submit a report
- [ ] View trending scams
- [ ] Create admin account and test admin functions
- [ ] Check browser console (F12) to see real-time Socket.io events
- [ ] Submit a report and see real-time alert in top-right corner

---

## 📚 Learn More

- [Full Setup Guide](SETUP.md) - Detailed setup instructions
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [README](README.md) - Project overview
- [Contributing](CONTRIBUTING.md) - How to contribute

---

## 🆘 Need Help?

1. Check [SETUP.md](SETUP.md) for detailed troubleshooting
2. Read [README.md](README.md) for architecture overview
3. Look at [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint details
4. Check browser console (F12) for errors
5. Check terminal output for server errors

---

## 🎉 You're all set!

ScamShield is now running. Here's what you can do:

✅ Search for known scams  
✅ See their risk scores and reports  
✅ Submit new scam reports  
✅ View trending scams  
✅ Manage as admin (after setup)  

**Stay safe and help protect the community! 🛡️**

---

## Next: Production Deployment

Ready to deploy? See [SETUP.md](SETUP.md) section "Production Deployment" for:
- Deploying backend to Heroku
- Deploying frontend to Vercel
- Setting up MongoDB Atlas
- Production security checklist

---

**Happy scam fighting! 🛡️✨**

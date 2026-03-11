# ScamShield API Documentation

Complete API reference for ScamShield backend.

## Base URL

```
http://localhost:5000/api
```

## Content Type

All requests and responses are `application/json`.

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Status:** 201 Created

---

### Login User

**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Status:** 200 OK

---

### Verify Token

**GET** `/auth/verify`

**Required:** Authentication token

Verify JWT token and get user info.

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Status:** 200 OK

---

## Scam Checker Endpoints

### Check Identifier Risk

**POST** `/check`

**Required:** Authentication token

Check risk score for any identifier.

**Request Body:**
```json
{
  "type": "telegram",
  "value": "@crypto_fastprofit"
}
```

**Valid Types:**
- `telegram` - Telegram username
- `phone` - Phone number
- `email` - Email address
- `website` - Website URL
- `crypto` - Cryptocurrency wallet address
- `card_bin` - Credit card BIN

**Response:**
```json
{
  "identifier": {
    "id": "507f1f77bcf86cd799439012",
    "value": "crypto_fastprofit",
    "type": "telegram",
    "riskScore": 87,
    "riskLevel": "Dangerous",
    "reportsCount": 15,
    "isBlacklisted": true,
    "firstReported": "2024-01-15T10:30:00Z",
    "lastReported": "2024-01-20T14:20:00Z",
    "suspiciousPatterns": [
      "suspicious_keywords",
      "impersonation_pattern"
    ]
  },
  "reports": [
    {
      "id": "507f1f77bcf86cd799439013",
      "category": "fake_investment",
      "description": "Promised 200% returns on crypto investment",
      "reporter": "user123",
      "createdAt": "2024-01-20T14:20:00Z"
    }
  ],
  "linkedIdentifiers": [
    {
      "value": "0x123abc...",
      "type": "crypto",
      "strength": 85
    }
  ],
  "status": "High Risk"
}
```

**Status:** 200 OK

---

### Get Reports for Identifier

**GET** `/reports/:value`

Get all verified reports for an identifier.

**Query Parameters:**
- `type` (required) - Type of identifier

**Example:**
```
GET /reports/crypto_fastprofit?type=telegram
```

**Response:**
```json
{
  "identifier": {
    "value": "crypto_fastprofit",
    "type": "telegram",
    "riskScore": 87
  },
  "reports": [
    {
      "id": "507f1f77bcf86cd799439013",
      "category": "fake_investment",
      "description": "Promised returns that never came",
      "reporter": "Anonymous",
      "amountLost": 5000,
      "currency": "USD",
      "scamDate": "2024-01-15T00:00:00Z",
      "createdAt": "2024-01-20T14:20:00Z"
    }
  ]
}
```

**Status:** 200 OK

---

## Report Endpoints

### Submit Scam Report

**POST** `/report`

**Required:** Authentication token

Submit a new scam report.

**Request Body:**
```json
{
  "type": "telegram",
  "value": "@scam_bot",
  "category": "fake_investment",
  "description": "Bot promised 100% returns on cryptocurrency investment. Took my money and blocked me.",
  "amountLost": 2500,
  "currency": "USD",
  "scamDate": "2024-01-18T10:00:00Z"
}
```

**Valid Categories:**
- `phishing` - Phishing / Fake Accounts
- `impersonation` - Impersonation
- `ponzi` - Ponzi Scheme
- `fake_investment` - Fake Investment
- `romance` - Romance Scam
- `money_laundering` - Money Laundering
- `other` - Other

**Response:**
```json
{
  "message": "Report submitted successfully",
  "report": {
    "id": "507f1f77bcf86cd799439014",
    "status": "pending",
    "identifier": {
      "value": "scam_bot",
      "type": "telegram"
    }
  }
}
```

**Status:** 201 Created

---

### Get Trending Scams

**GET** `/trending`

Get trending scam statistics.

**Query Parameters:**
- `days` (optional) - Number of days to analyze (default: 30)

**Example:**
```
GET /trending?days=7
```

**Response:**
```json
{
  "trendingTypes": [
    {
      "_id": "telegram",
      "count": 42,
      "categories": ["fake_investment", "phishing"],
      "examples": ["@crypto_bot", "@money_faster"]
    }
  ],
  "topCategories": [
    {
      "_id": "fake_investment",
      "count": 85
    },
    {
      "_id": "phishing",
      "count": 67
    }
  ],
  "period": "7 days"
}
```

**Status:** 200 OK

---

### Get User's Reports

**GET** `/my-reports`

**Required:** Authentication token

Get all reports submitted by logged-in user.

**Response:**
```json
{
  "reports": [
    {
      "id": "507f1f77bcf86cd799439014",
      "identifier": {
        "value": "scam_bot",
        "type": "telegram"
      },
      "category": "fake_investment",
      "status": "pending",
      "createdAt": "2024-01-20T14:20:00Z"
    }
  ]
}
```

**Status:** 200 OK

---

## Admin Endpoints

**All admin endpoints require:**
- Authentication token
- Admin role (`role: "admin"`)

---

### Approve Report

**POST** `/admin/reports/:reportId/approve`

**Required:** Admin authentication

Approve a pending report.

**Response:**
```json
{
  "message": "Report approved successfully"
}
```

**Status:** 200 OK

---

### Reject Report

**POST** `/admin/reports/:reportId/reject`

**Required:** Admin authentication

Reject a pending report.

**Request Body:**
```json
{
  "reason": "Insufficient evidence provided"
}
```

**Response:**
```json
{
  "message": "Report rejected successfully"
}
```

**Status:** 200 OK

---

### Blacklist Identifier

**POST** `/admin/identifiers/:identifierId/blacklist`

**Required:** Admin authentication

Add identifier to blacklist (high-risk items).

**Request Body:**
```json
{
  "reason": "Confirmed scam network operator"
}
```

**Response:**
```json
{
  "message": "Identifier blacklisted successfully",
  "identifier": {
    "value": "scam_bot",
    "riskScore": 95
  }
}
```

**Status:** 200 OK

---

### Ban User

**POST** `/admin/users/:userId/ban`

**Required:** Admin authentication

Ban a user account.

**Response:**
```json
{
  "message": "User banned successfully"
}
```

**Status:** 200 OK

---

### Unban User

**POST** `/admin/users/:userId/unban`

**Required:** Admin authentication

Restore a banned user.

**Response:**
```json
{
  "message": "User unbanned successfully"
}
```

**Status:** 200 OK

---

### Get Admin Statistics

**GET** `/admin/stats`

**Required:** Admin authentication

Get dashboard statistics for admin.

**Response:**
```json
{
  "reports": {
    "total": 245,
    "pending": 12,
    "verified": 220,
    "last7Days": 45
  },
  "identifiers": {
    "total": 1250,
    "blacklisted": 85
  },
  "users": {
    "total": 342,
    "banned": 8
  }
}
```

**Status:** 200 OK

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

### Common Error Codes

| Status | Message | Meaning |
|--------|---------|---------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

(Not currently implemented, but recommended for production)

Future implementation:
- Max 100 API calls per minute per user
- Max 1000 calls per hour per user

---

## Pagination

(For future large dataset support)

Recommended query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

---

## WebSocket Events (Socket.io)

### Client Connection

```javascript
const socket = io('http://localhost:5000');

socket.emit('join_user', userId);
```

### Server Events

**new_report** - New scam report submitted
```javascript
socket.on('new_report', (report) => {
  console.log('New report:', report);
  // { id, type, value, category, timestamp }
});
```

**report_approved** - Report verified
```javascript
socket.on('report_approved', (data) => {
  console.log('Report approved:', data);
  // { reportId, status }
});
```

**identifier_blacklisted** - Identifier added to blacklist
```javascript
socket.on('identifier_blacklisted', (data) => {
  console.log('Blacklisted:', data);
  // { value, type, riskScore }
});
```

---

## Usage Examples

### cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Check identifier (with token)
curl -X POST http://localhost:5000/api/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "telegram",
    "value": "@crypto_fastprofit"
  }'
```

### JavaScript/Fetch

```javascript
// Register
const res = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  })
});

const data = await res.json();
const token = data.token;

// Check identifier
const checkRes = await fetch('http://localhost:5000/api/check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'telegram',
    value: '@crypto_fastprofit'
  })
});

const result = await checkRes.json();
console.log(result);
```

---

## Version History

- **v1.0.0** (Current) - Initial release with core features

---

## Support

For API issues or questions, please open an issue on GitHub.

---

**Last Updated:** January 2024

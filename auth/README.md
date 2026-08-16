# BE-03: Auth - Login & Protect

A secure REST API with Supabase Auth — signup, login, logout, and protected routes verified via JWT.

## Setup

1. Create a free project at supabase.com
2. Copy `.env.example` to `.env` and fill in your values
3. In Supabase dashboard: Authentication → Email → turn off "Confirm email"

## Run
```bash
npm install
node server.js
```

## API Endpoints

| Route | Method | Auth Required | Description |
|---|---|---|---|
| /public/info | GET | No | Public info |
| /auth/signup | POST | No | Register new user |
| /auth/login | POST | No | Login, returns JWT |
| /auth/logout | POST | Yes | End session |
| /protected/profile | GET | Yes | User profile |
| /protected/dashboard | GET | Yes | User dashboard |

## Test it

```bash
# Signup
curl -i -X POST http://localhost:3001/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Login
curl -i -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Protected route (paste your token)
curl -i http://localhost:3001/protected/profile -H "Authorization: Bearer YOUR_TOKEN"

# No token - returns 401
curl -i http://localhost:3001/protected/profile
```

## Auth flow
1. Client sends credentials to POST /auth/login
2. Supabase validates and returns a JWT
3. Client sends JWT in Authorization header on protected routes
4. Server verifies token with Supabase before allowing access
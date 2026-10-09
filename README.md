# TruthLens

TruthLens checks how credible a piece of news or a social post is, and when it looks false or unverified, shows what the facts actually say.

**Stack:** React (Vite) + Tailwind CSS v3 · Node/Express · MongoDB · Flask (TextBlob + Groq)

```
client (Vercel) ──► server (Render, Express) ──► ml-service (Render, Flask) ──► Groq
                          │
                          └──► MongoDB Atlas
```

## Features
- Credibility verdict (credible / unverified / likely false), 0–100 score, red flags, language signals
- **What the facts say** for false or unverified items: a short correction, key facts and sources. When the search-enabled model is available the answer is grounded in a live web search; otherwise it is clearly labelled as model knowledge only
- Dashboard with totals, 14-day activity and verdict mix
- History with search, verdict filter, detail view, delete and CSV export
- JWT auth, input validation, rate limiting, caching

## Local setup (Windows)

### 1. MongoDB
Create a free cluster on MongoDB Atlas and copy the connection string (use a database name such as `/truthlens`).

### 2. ml-service
```
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```
Set `GROQ_API_KEY` in `.env` (or `MOCK_LLM=true` to try the app without a key).

### 3. server
```
cd server
npm install
copy .env.example .env
npm run dev
```

### 4. client
```
cd client
npm install
copy .env.example .env
npm run dev
```
Open http://localhost:5173

## Environment variables
| Service | Variable | Purpose |
|---|---|---|
| ml-service | `GROQ_API_KEY` | Key from console.groq.com |
| ml-service | `GROQ_MODELS` | Credibility models, tried in order |
| ml-service | `FACTCHECK_MODELS` | Fact-check models; first one that supports search is used for sources |
| ml-service | `ENABLE_FACTCHECK` | `true` / `false` |
| ml-service | `MOCK_LLM` | `true` runs without Groq |
| ml-service | `ML_API_KEY` | Shared secret, must equal the server's value |
| server | `MONGO_URI` | MongoDB connection string |
| server | `JWT_SECRET` | 32+ random characters |
| server | `CLIENT_URL` | Frontend origin(s), comma separated, no trailing slash |
| server | `ML_SERVICE_URL` | URL of the ML service |
| server | `ML_API_KEY` | Same secret as the ML service |
| server | `RENDER_EXTERNAL_URL` | Server's own public URL (keeps the free tier awake) |
| client | `VITE_API_URL` | URL of the server |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Deploy
1. **MongoDB Atlas:** allow network access (`0.0.0.0/0`) and copy the connection string.
2. **Render:** create the two services from `render.yaml` (or manually) and fill in the secret variables.
3. **Vercel:** import the `client` folder, framework Vite, set `VITE_API_URL` to the server URL.
4. Put the Vercel URL into the server's `CLIENT_URL` and redeploy.

## API
| Method | Route | Auth |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | — |
| GET | `/api/auth/me` | required |
| POST | `/api/analysis/analyze` | optional (saved to history when signed in) |
| GET | `/api/analysis/history?page=&limit=&verdict=&q=` | required |
| GET | `/api/analysis/stats?tz=` | required |
| GET | `/api/analysis/export` | required (CSV) |
| DELETE | `/api/analysis/history/:id` | required |

## Limitations
Assessments are automated and can be wrong. Without live search the fact-check reflects the model's training knowledge and may be outdated. Always confirm important claims with primary sources.
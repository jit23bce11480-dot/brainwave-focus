# BrainWave Focus

A full-stack web app that estimates how long you can focus from a short lifestyle questionnaire, then runs a focus timer with a binaural tone for when your attention drifts.

- **Frontend:** React 18 (Create React App), Tailwind CSS, lucide-react icons, Web Audio API
- **Backend:** Node.js, Express REST API, JSON file storage
- **Tests:** Jest + Supertest (backend)

The focus estimate is a **rule-based model** (points added and subtracted for sleep, stress, exercise, caffeine, screen time and age). It is not machine learning and not medical advice.

## Run it locally

You need Node.js 18 or newer.

```
cd backend
npm install
npm start          # API on http://localhost:3000
```

In a second terminal:

```
cd frontend
npm install
npm start          # app on http://localhost:3001
```

Run the backend tests:

```
cd backend
npm test
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Health check |
| POST | `/api/analyze` | Validate the questionnaire, score it, save the user, return analysis + recommendations |
| GET | `/api/user/:userId` | One user's saved record |
| POST | `/api/session/start` | Start a focus session (201) |
| POST | `/api/session/break` | Count a lost-focus break |
| POST | `/api/session/end` | End a session, compute duration and efficiency |
| GET | `/api/sessions/:userId` | Last 10 finished sessions |
| GET | `/api/stats/:userId` | Averages across finished sessions |

Bad input gets `400` with a `details` list; unknown IDs get `404`; ending a session twice gets `409`.

## Configuration

| Variable | Where | Default | Meaning |
| --- | --- | --- | --- |
| `PORT` | backend | `3000` | Port the API listens on |
| `ALLOWED_ORIGIN` | backend | any origin | Frontend URL(s) allowed by CORS, comma-separated |
| `DATA_DIR` | backend | `backend/data` | Where `users.json` and `sessions.json` are kept |
| `REACT_APP_API_URL` | frontend (build time) | `http://localhost:3000` | Address of the API |

## Known limitations

- Data is stored in JSON files: fine for a demo, but a real deployment should use a database (e.g. MongoDB or PostgreSQL), especially on hosts whose disk is wiped on restart.
- There is no login. User IDs are random UUIDs, so they can't be guessed, but anyone holding an ID can read that user's data.
- The scoring rules exist in two places (`backend/brainwaveProfile.js` and the offline copy in `frontend/src/brainwaveProfile.js`); a backend test fails if they ever disagree.

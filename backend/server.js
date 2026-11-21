const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const {
  validateUserData,
  calculateBrainwaveProfile,
  generateRecommendations,
  calculateEfficiency,
} = require('./brainwaveProfile');

const app = express();
const PORT = process.env.PORT || 3000;

// Only the frontend's address may call the API once ALLOWED_ORIGIN is set
// (comma-separated for several). Without it, any origin is allowed (local development).
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : '*';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// ---------- Storage (JSON files) ----------

async function initializeStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const file of [USERS_FILE, SESSIONS_FILE]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify([]));
    }
  }
}

async function readList(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return [];
  }
}

async function writeList(file, list) {
  await fs.writeFile(file, JSON.stringify(list, null, 2));
}

// Every change is "read whole file -> change -> write whole file".
// If two requests did that at the same time, one change would be lost (a race condition).
// This queue makes changes run one after another.
let fileQueue = Promise.resolve();
function withFileLock(task) {
  const run = fileQueue.then(task, task);
  fileQueue = run.catch(() => {});
  return run;
}

// Random, unguessable IDs (timestamps can collide and are easy to guess).
const newId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

// ---------- Routes ----------

app.get('/', (req, res) => {
  res.json({ status: 'BrainWave API Running', version: '1.1.0' });
});

app.post('/api/analyze', async (req, res) => {
  const { errors, data } = validateUserData(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Invalid questionnaire', details: errors });
  }

  try {
    const analysisResults = calculateBrainwaveProfile(data);
    const requestedId = typeof req.body.userId === 'string' ? req.body.userId : null;

    const userRecord = await withFileLock(async () => {
      const users = await readList(USERS_FILE);
      const existingIndex = requestedId ? users.findIndex((u) => u.userId === requestedId) : -1;
      const now = new Date().toISOString();
      const record = {
        // Clients can only reuse an ID the server gave out earlier, never invent one.
        userId: existingIndex >= 0 ? requestedId : newId('user'),
        ...data,
        analysisResults,
        createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : now,
        updatedAt: now,
      };
      if (existingIndex >= 0) users[existingIndex] = record;
      else users.push(record);
      await writeList(USERS_FILE, users);
      return record;
    });

    res.json({
      success: true,
      userId: userRecord.userId,
      analysis: analysisResults,
      recommendations: generateRecommendations(data, analysisResults),
    });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  try {
    const users = await readList(USERS_FILE);
    const user = users.find((u) => u.userId === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

app.post('/api/session/start', async (req, res) => {
  const { userId } = req.body || {};
  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const users = await readList(USERS_FILE);
    if (!users.some((u) => u.userId === userId)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = await withFileLock(async () => {
      const sessions = await readList(SESSIONS_FILE);
      const newSession = {
        sessionId: newId('session'),
        userId,
        concentrationBreaks: 0,
        startTime: new Date().toISOString(),
        completed: false,
      };
      sessions.push(newSession);
      await writeList(SESSIONS_FILE, sessions);
      return newSession;
    });

    res.status(201).json({ success: true, sessionId: session.sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Shared by /break and /end: find an open session and change it.
// Returns { status, body } so the route can send it.
async function updateOpenSession(sessionId, change) {
  if (typeof sessionId !== 'string') {
    return { status: 400, body: { error: 'sessionId is required' } };
  }
  return withFileLock(async () => {
    const sessions = await readList(SESSIONS_FILE);
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (!session) return { status: 404, body: { error: 'Session not found' } };
    if (session.completed) return { status: 409, body: { error: 'Session already ended' } };
    change(session);
    await writeList(SESSIONS_FILE, sessions);
    return { status: 200, body: { success: true, session } };
  });
}

app.post('/api/session/break', async (req, res) => {
  try {
    const result = await updateOpenSession((req.body || {}).sessionId, (session) => {
      session.concentrationBreaks += 1;
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

app.post('/api/session/end', async (req, res) => {
  try {
    const result = await updateOpenSession((req.body || {}).sessionId, (session) => {
      session.endTime = new Date().toISOString();
      session.totalDuration = Math.round(
        (new Date(session.endTime) - new Date(session.startTime)) / 1000
      );
      session.efficiency = calculateEfficiency(session.totalDuration, session.concentrationBreaks);
      session.completed = true;
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const sessions = await readList(SESSIONS_FILE);
    const userSessions = sessions
      .filter((s) => s.userId === req.params.userId && s.completed)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 10);
    res.json({ success: true, sessions: userSessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

app.get('/api/stats/:userId', async (req, res) => {
  try {
    const sessions = await readList(SESSIONS_FILE);
    const userSessions = sessions.filter((s) => s.userId === req.params.userId && s.completed);

    if (userSessions.length === 0) {
      return res.json({ success: true, stats: null });
    }

    const totalSessions = userSessions.length;
    const sum = (key) => userSessions.reduce((total, s) => total + s[key], 0);

    res.json({
      success: true,
      stats: {
        totalSessions,
        averageDuration: Math.round(sum('totalDuration') / totalSessions / 60),
        averageBreaks: Math.round((sum('concentrationBreaks') / totalSessions) * 10) / 10,
        averageEfficiency: Math.round(sum('efficiency') / totalSessions),
        totalFocusTime: Math.round(sum('totalDuration') / 60),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// Bad JSON in a request body: reply in JSON instead of Express's default HTML page.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  next(err);
});

// Start listening only when run with `node server.js`, not when a test imports this file.
if (require.main === module) {
  initializeStorage()
    .then(() => {
      app.listen(PORT, () => console.log(`API running on port ${PORT}`));
    })
    .catch((error) => {
      console.error('Could not prepare storage:', error);
      process.exit(1);
    });
}

module.exports = { app, initializeStorage };

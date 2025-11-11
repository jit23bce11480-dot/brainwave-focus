const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

async function initializeStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
    try {
      await fs.access(SESSIONS_FILE);
    } catch {
      await fs.writeFile(SESSIONS_FILE, JSON.stringify([]));
    }
    console.log('Storage initialized');
  } catch (error) {
    console.error('Storage error:', error);
  }
}

async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function readSessions() {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSessions(sessions) {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function calculateBrainwaveProfile(userData) {
  const { age, sleepHours, stressLevel, exerciseFrequency, caffeine, screenTime } = userData;
  let baseConcentration = 45;
  
  if (age < 25) baseConcentration += 10;
  else if (age > 50) baseConcentration -= 10;
  
  if (sleepHours >= 7 && sleepHours <= 9) baseConcentration += 15;
  else if (sleepHours < 6) baseConcentration -= 20;
  
  baseConcentration -= (stressLevel * 3);
  
  const exerciseBonus = { 'daily': 15, 'weekly': 10, 'occasionally': 5, 'rarely': -5 };
  baseConcentration += (exerciseBonus[exerciseFrequency] || 0);
  
  const caffeineEffect = { 'none': 0, 'low': 5, 'moderate': 5, 'high': -10 };
  baseConcentration += (caffeineEffect[caffeine] || 0);
  
  if (screenTime > 8) baseConcentration -= 15;
  else if (screenTime < 4) baseConcentration += 10;
  
  baseConcentration = Math.max(15, Math.min(90, baseConcentration));
  
  return {
    maxConcentration: baseConcentration,
    recommendedBreak: Math.round(baseConcentration * 0.3),
    breakInterval: Math.round(baseConcentration * 0.6),
    alphaFrequency: stressLevel > 7 ? 8 : (stressLevel > 4 ? 10 : 12)
  };
}

function generateRecommendations(userData, analysis) {
  const recommendations = [];
  
  if (userData.sleepHours < 7) {
    recommendations.push({
      category: 'Sleep',
      priority: 'high',
      message: 'Increase sleep to 7-9 hours to improve focus by up to 25%'
    });
  }
  
  if (userData.stressLevel > 7) {
    recommendations.push({
      category: 'Stress',
      priority: 'high',
      message: 'Practice meditation. Use alpha wave therapy regularly.'
    });
  }
  
  recommendations.push({
    category: 'Work Pattern',
    priority: 'high',
    message: `Work in ${analysis.maxConcentration} min blocks with ${analysis.recommendedBreak} min breaks`
  });
  
  return recommendations;
}

app.get('/', (req, res) => {
  res.json({ status: 'BrainWave API Running', version: '1.0.0' });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const userData = req.body;
    const userId = userData.userId || `user_${Date.now()}`;
    
    const analysisResults = calculateBrainwaveProfile(userData);
    const users = await readUsers();
    const existingIndex = users.findIndex(u => u.userId === userId);
    
    const userRecord = {
      userId,
      ...userData,
      analysisResults,
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      users[existingIndex] = userRecord;
    } else {
      users.push(userRecord);
    }
    
    await writeUsers(users);
    
    res.json({
      success: true,
      userId: userRecord.userId,
      analysis: analysisResults,
      recommendations: generateRecommendations(userData, analysisResults)
    });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.userId === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

app.post('/api/session/start', async (req, res) => {
  try {
    const { userId } = req.body;
    const sessions = await readSessions();
    const sessionId = `session_${Date.now()}`;
    
    const session = {
      sessionId,
      userId,
      concentrationBreaks: 0,
      startTime: new Date().toISOString(),
      completed: false
    };
    
    sessions.push(session);
    await writeSessions(sessions);
    res.json({ success: true, sessionId: session.sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/session/break', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const sessions = await readSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    session.concentrationBreaks += 1;
    await writeSessions(sessions);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

app.post('/api/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const sessions = await readSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    session.endTime = new Date().toISOString();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    session.totalDuration = Math.round((end - start) / 1000);
    
    const expectedBreaks = Math.floor(session.totalDuration / (30 * 60));
    session.efficiency = Math.max(0, Math.min(100, 100 - (session.concentrationBreaks - expectedBreaks) * 10));
    session.completed = true;
    
    await writeSessions(sessions);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const sessions = await readSessions();
    const userSessions = sessions
      .filter(s => s.userId === req.params.userId && s.completed)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 10);
    res.json({ success: true, sessions: userSessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

app.get('/api/stats/:userId', async (req, res) => {
  try {
    const sessions = await readSessions();
    const userSessions = sessions.filter(s => s.userId === req.params.userId && s.completed);
    
    if (userSessions.length === 0) {
      return res.json({ success: true, stats: null });
    }
    
    const totalSessions = userSessions.length;
    const avgDuration = userSessions.reduce((sum, s) => sum + s.totalDuration, 0) / totalSessions;
    const avgBreaks = userSessions.reduce((sum, s) => sum + s.concentrationBreaks, 0) / totalSessions;
    const avgEfficiency = userSessions.reduce((sum, s) => sum + s.efficiency, 0) / totalSessions;
    
    res.json({
      success: true,
      stats: {
        totalSessions,
        averageDuration: Math.round(avgDuration / 60),
        averageBreaks: Math.round(avgBreaks * 10) / 10,
        averageEfficiency: Math.round(avgEfficiency),
        totalFocusTime: Math.round(userSessions.reduce((sum, s) => sum + s.totalDuration, 0) / 60)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

initializeStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ API running on port ${PORT}`);
  });
});

module.exports = app;
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

// Use a throwaway folder so tests never touch real data.
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainwave-test-'));
process.env.DATA_DIR = tempDir;
const { app, initializeStorage } = require('../server');

const answers = {
  age: '21',
  sleepHours: '7.5',
  stressLevel: '6',
  exerciseFrequency: 'weekly',
  caffeine: 'moderate',
  screenTime: '9',
  workType: 'analytical',
};

beforeAll(() => initializeStorage());
afterAll(() => fs.rmSync(tempDir, { recursive: true, force: true }));

test('GET / reports the API is running', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('BrainWave API Running');
});

describe('POST /api/analyze', () => {
  test('returns analysis, recommendations and a new userId', async () => {
    const res = await request(app).post('/api/analyze').send(answers);
    expect(res.status).toBe(200);
    expect(res.body.analysis.maxConcentration).toBe(52);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    expect(res.body.userId).toMatch(/^user_[0-9a-f-]{36}$/);
  });

  test('sending the same userId back updates that user instead of creating another', async () => {
    const first = await request(app).post('/api/analyze').send(answers);
    const second = await request(app)
      .post('/api/analyze')
      .send({ ...answers, stressLevel: '9', userId: first.body.userId });
    expect(second.body.userId).toBe(first.body.userId);

    const saved = await request(app).get(`/api/user/${first.body.userId}`);
    expect(saved.body.user.stressLevel).toBe(9);
  });

  test('an unknown userId gets a fresh ID (clients cannot choose IDs)', async () => {
    const res = await request(app).post('/api/analyze').send({ ...answers, userId: 'user_made_up' });
    expect(res.body.userId).not.toBe('user_made_up');
  });

  test('rejects bad input with 400 and a list of problems', async () => {
    const res = await request(app).post('/api/analyze').send({ ...answers, age: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('age must be a number');
  });

  test('rejects broken JSON with a JSON error', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Content-Type', 'application/json')
      .send('{"age": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Request body is not valid JSON');
  });

  test('many requests at once are all saved (no lost writes)', async () => {
    const before = JSON.parse(fs.readFileSync(path.join(tempDir, 'users.json'), 'utf8')).length;
    await Promise.all(Array.from({ length: 20 }, () => request(app).post('/api/analyze').send(answers)));
    const after = JSON.parse(fs.readFileSync(path.join(tempDir, 'users.json'), 'utf8')).length;
    expect(after - before).toBe(20);
  });
});

describe('focus sessions', () => {
  let userId;
  beforeAll(async () => {
    userId = (await request(app).post('/api/analyze').send(answers)).body.userId;
  });

  test('start -> 2 breaks -> end, then it shows in sessions and stats', async () => {
    const start = await request(app).post('/api/session/start').send({ userId });
    expect(start.status).toBe(201);
    const { sessionId } = start.body;

    await request(app).post('/api/session/break').send({ sessionId });
    const brk = await request(app).post('/api/session/break').send({ sessionId });
    expect(brk.body.session.concentrationBreaks).toBe(2);

    const end = await request(app).post('/api/session/end').send({ sessionId });
    expect(end.status).toBe(200);
    expect(end.body.session.completed).toBe(true);
    expect(end.body.session.efficiency).toBe(80); // under 30 min: 0 free breaks, 2 extra

    const list = await request(app).get(`/api/sessions/${userId}`);
    expect(list.body.sessions).toHaveLength(1);

    const stats = await request(app).get(`/api/stats/${userId}`);
    expect(stats.body.stats.totalSessions).toBe(1);
    expect(stats.body.stats.averageEfficiency).toBe(80);
  });

  test('ending a session twice is refused with 409', async () => {
    const { sessionId } = (await request(app).post('/api/session/start').send({ userId })).body;
    await request(app).post('/api/session/end').send({ sessionId });
    const again = await request(app).post('/api/session/end').send({ sessionId });
    expect(again.status).toBe(409);
  });

  test('cannot start a session for an unknown user', async () => {
    const res = await request(app).post('/api/session/start').send({ userId: 'user_nobody' });
    expect(res.status).toBe(404);
  });

  test('missing sessionId is a 400, unknown sessionId is a 404', async () => {
    expect((await request(app).post('/api/session/break').send({})).status).toBe(400);
    expect((await request(app).post('/api/session/break').send({ sessionId: 'nope' })).status).toBe(404);
  });

  test('stats are null for a user with no finished sessions', async () => {
    const fresh = (await request(app).post('/api/analyze').send(answers)).body.userId;
    const res = await request(app).get(`/api/stats/${fresh}`);
    expect(res.body.stats).toBeNull();
  });
});

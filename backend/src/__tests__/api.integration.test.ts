import request from 'supertest';
import { app } from '../app';
import { db, initializeDb } from '../lib/db/client';
import fs from 'fs';
import path from 'path';

const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword',
  name: 'Test User'
};

let authToken: string;
let userId: string;

beforeAll(async () => {
  // Ensure database directory exists
  const dbDir = path.join(process.cwd(), 'data/db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize database connection
  await initializeDb();
  
  // Set up test database
  const schemaPath = path.join(__dirname, '../../src/lib/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await db.execute({ sql: schema, args: [] });

  // Clean up test database
  await db.execute({ 
    sql: 'DELETE FROM users WHERE email = ?',
    args: [TEST_USER.email]
  });
  await db.execute({ 
    sql: 'DELETE FROM topics WHERE 1=1',
    args: []
  });
  await db.execute({ 
    sql: 'DELETE FROM lessons WHERE 1=1',
    args: []
  });
  await db.execute({ 
    sql: 'DELETE FROM lesson_progress WHERE 1=1',
    args: []
  });
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.name).toBe(TEST_USER.name);

    authToken = res.body.token;
    userId = res.body.user.user_id;
  });

  it('should login existing user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(TEST_USER.email);
  });
});

describe('Topics API', () => {
  let topicId: number;

  it('should create a new topic', async () => {
    const res = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Topic',
        description: 'Test Description'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('topic_id');
    expect(res.body.title).toBe('Test Topic');
    expect(res.body.description).toBe('Test Description');

    topicId = res.body.topic_id;
  });

  it('should get all topics', async () => {
    const res = await request(app)
      .get('/api/topics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a specific topic', async () => {
    const res = await request(app)
      .get(`/api/topics/${topicId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.topic_id).toBe(topicId);
    expect(res.body.title).toBe('Test Topic');
  });

  it('should update a topic', async () => {
    const res = await request(app)
      .put(`/api/topics/${topicId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Topic',
        description: 'Updated Description'
      });

    expect(res.status).toBe(200);
    expect(res.body.topic_id).toBe(topicId);
    expect(res.body.title).toBe('Updated Topic');
    expect(res.body.description).toBe('Updated Description');
  });
});

describe('Lessons API', () => {
  let topicId: number;
  let lessonId: number;

  beforeAll(async () => {
    // Create a test topic
    const res = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Topic for Lessons',
        description: 'Test Description'
      });

    topicId = res.body.topic_id;
  });

  it('should create a new lesson', async () => {
    const res = await request(app)
      .post('/api/lessons')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Lesson',
        content: 'Test Content',
        topicId,
        orderIndex: 1
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('lesson_id');
    expect(res.body.title).toBe('Test Lesson');
    expect(res.body.content).toBe('Test Content');

    lessonId = res.body.lesson_id;
  });

  it('should get topic lessons', async () => {
    const res = await request(app)
      .get(`/api/lessons/topic/${topicId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a specific lesson', async () => {
    const res = await request(app)
      .get(`/api/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.lesson_id).toBe(lessonId);
    expect(res.body.title).toBe('Test Lesson');
  });

  it('should update a lesson', async () => {
    const res = await request(app)
      .put(`/api/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Lesson',
        content: 'Updated Content'
      });

    expect(res.status).toBe(200);
    expect(res.body.lesson_id).toBe(lessonId);
    expect(res.body.title).toBe('Updated Lesson');
    expect(res.body.content).toBe('Updated Content');
  });

  it('should update lesson progress', async () => {
    const res = await request(app)
      .put(`/api/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'completed'
      });

    expect(res.status).toBe(200);
    expect(res.body.lesson_id).toBe(lessonId);
    expect(res.body.status).toBe('completed');
  });

  it('should get lesson progress', async () => {
    const res = await request(app)
      .get(`/api/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.lesson_id).toBe(lessonId);
    expect(res.body.status).toBe('completed');
  });
});

afterAll(async () => {
  // Clean up test database
  await db.execute({ 
    sql: 'DELETE FROM users WHERE email = ?',
    args: [TEST_USER.email]
  });
  await db.execute({ 
    sql: 'DELETE FROM topics WHERE 1=1',
    args: []
  });
  await db.execute({ 
    sql: 'DELETE FROM lessons WHERE 1=1',
    args: []
  });
  await db.execute({ 
    sql: 'DELETE FROM lesson_progress WHERE 1=1',
    args: []
  });
});

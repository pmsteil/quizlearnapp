import request from 'supertest';
import { app } from '../app';
import { db } from '../lib/db';
import { hash } from 'bcrypt';

describe('API Integration Tests', () => {
  let authToken: string;
  let userId: number;
  let topicId: number;
  let lessonId: number;

  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  };

  const testTopic = {
    title: 'Test Topic',
    description: 'A topic for testing',
    difficulty: 'beginner'
  };

  const testLesson = {
    title: 'Test Lesson',
    content: 'This is test lesson content',
    order_index: 1
  };

  beforeAll(async () => {
    // Clear test data
    await db.run('DELETE FROM users WHERE email = ?', [testUser.email]);
    await db.run('DELETE FROM topics WHERE title = ?', [testTopic.title]);
  });

  afterAll(async () => {
    // Clean up test data
    await db.run('DELETE FROM users WHERE email = ?', [testUser.email]);
    await db.run('DELETE FROM topics WHERE title = ?', [testTopic.title]);
    await db.close();
  });

  describe('Authentication Flow', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      userId = response.body.user.user_id;
    });

    it('should login with created user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      authToken = response.body.access_token;
    });

    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user_id', userId);
      expect(response.body).toHaveProperty('email', testUser.email);
    });
  });

  describe('Topics Flow', () => {
    it('should create a new topic', async () => {
      const response = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTopic);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('topic_id');
      expect(response.body.title).toBe(testTopic.title);
      topicId = response.body.topic_id;
    });

    it('should get all topics', async () => {
      const response = await request(app)
        .get('/api/v1/topics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(topic => topic.topic_id === topicId)).toBe(true);
    });

    it('should get a specific topic', async () => {
      const response = await request(app)
        .get(`/api/v1/topics/${topicId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('topic_id', topicId);
      expect(response.body).toHaveProperty('title', testTopic.title);
    });
  });

  describe('Lessons Flow', () => {
    it('should create a new lesson', async () => {
      const response = await request(app)
        .post(`/api/v1/topics/${topicId}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLesson);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('lesson_id');
      expect(response.body.title).toBe(testLesson.title);
      lessonId = response.body.lesson_id;
    });

    it('should get lessons for a topic', async () => {
      const response = await request(app)
        .get(`/api/v1/topics/${topicId}/lessons`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(lesson => lesson.lesson_id === lessonId)).toBe(true);
    });

    it('should update lesson progress', async () => {
      const response = await request(app)
        .put(`/api/v1/users/me/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'completed');
    });

    it('should get lesson progress', async () => {
      const response = await request(app)
        .get(`/api/v1/users/me/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'completed');
    });
  });

  describe('Error Cases', () => {
    it('should fail to login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    it('should fail to access protected route without token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me');

      expect(response.status).toBe(401);
    });

    it('should fail to create topic without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should fail to create lesson without required fields', async () => {
      const response = await request(app)
        .post(`/api/v1/topics/${topicId}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});

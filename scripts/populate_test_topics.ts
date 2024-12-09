import { createClient } from '@libsql/client';
import { createHash } from 'crypto';

const db = createClient({
  url: process.env.VITE_DATABASE_URL as string,
  authToken: process.env.VITE_DATABASE_TOKEN as string,
});

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTitle() {
  const subjects = ['Python', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'AWS', 'Git', 'HTML/CSS'];
  const topics = ['Basics', 'Advanced', 'Best Practices', 'Architecture', 'Performance', 'Security', 'Testing', 'Deployment'];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  return `${subject} ${topic}`;
}

function generateRandomDescription() {
  const descriptions = [
    'Learn the fundamentals and best practices',
    'Master advanced concepts and techniques',
    'Practical guide to real-world applications',
    'Deep dive into core principles',
    'Comprehensive overview with hands-on examples',
    'Essential skills for modern development',
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

async function populateTestTopics() {
  try {
    console.log('Starting to populate test topics...');
    console.log('Database URL:', process.env.VITE_DATABASE_URL);

    const USER_EMAIL = 'patrick@infranet.com';

    // Look up user by email first
    const userCheck = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [USER_EMAIL]
    });
    console.log('User check result:', userCheck.rows);

    if (userCheck.rows.length === 0) {
      throw new Error(`User with email ${USER_EMAIL} does not exist in the database`);
    }

    const USER_ID = userCheck.rows[0].id;
    console.log('Found user ID:', USER_ID);

    // Clean up existing topics first
    console.log('Cleaning up existing topics...');
    await db.execute({
      sql: 'DELETE FROM topics WHERE user_id = ?',
      args: [USER_ID]
    });
    console.log('Cleaned up existing topics');

    const now = Math.floor(Date.now() / 1000);
    console.log('Using timestamp:', now);

    for (let i = 0; i < 1000; i++) {
      const title = generateRandomTitle();
      const description = generateRandomDescription();
      const progress = getRandomInt(0, 100);
      const topicId = `topic-${i + 1}`;

      const defaultLessonPlan = {
        mainTopics: [{
          name: "Learning Path",
          subtopics: [
            { name: 'Introduction', status: progress === 0 ? 'current' : progress === 100 ? 'completed' : 'upcoming' },
            { name: 'Basic Concepts', status: 'upcoming' },
            { name: 'Practice Exercises', status: 'upcoming' },
            { name: 'Advanced Topics', status: 'upcoming' },
            { name: 'Final Review', status: 'upcoming' }
          ]
        }],
        currentTopic: 'Introduction',
        completedTopics: []
      };

      console.log(`Creating topic ${i + 1}:`, {
        id: topicId,
        user_id: USER_ID,
        title,
        description,
        progress,
        lesson_plan: defaultLessonPlan
      });

      try {
        await db.execute({
          sql: `INSERT INTO topics (id, user_id, title, description, progress, lesson_plan, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            topicId,
            USER_ID,
            title,
            description,
            progress,
            JSON.stringify(defaultLessonPlan),
            now,
            now
          ]
        });
        console.log(`Successfully created topic ${i + 1}`);
      } catch (error) {
        console.error(`Failed to create topic ${i + 1}:`, error);
        throw error;
      }

      if (i % 100 === 0) {
        console.log(`Created ${i} topics...`);
      }
    }

    console.log('Successfully created 1000 test topics');
  } catch (error) {
    console.error('Error populating test topics:', error);
    throw error;
  }
}

populateTestTopics()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

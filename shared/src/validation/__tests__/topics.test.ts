import { createTopicSchema } from '../topics';

describe('Topics Validation', () => {
  const validLessonPlan = {
    mainTopics: [
      {
        name: 'Main Topic 1',
        subtopics: [
          {
            name: 'Subtopic 1',
            status: 'not-started' as const,
          },
          {
            name: 'Subtopic 2',
            status: 'current' as const,
            icon: 'book',
          },
        ],
      },
    ],
    currentTopic: 'Subtopic 2',
    completedTopics: [],
  };

  it('should validate valid topic data', () => {
    const validData = {
      title: 'Test Topic',
      description: 'This is a test topic description',
      lessonPlan: validLessonPlan,
    };
    const result = createTopicSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject short title', () => {
    const invalidData = {
      title: 'Te',
      description: 'This is a test topic description',
      lessonPlan: validLessonPlan,
    };
    const result = createTopicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject short description', () => {
    const invalidData = {
      title: 'Test Topic',
      description: 'Short',
      lessonPlan: validLessonPlan,
    };
    const result = createTopicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject empty main topics', () => {
    const invalidData = {
      title: 'Test Topic',
      description: 'This is a test topic description',
      lessonPlan: {
        ...validLessonPlan,
        mainTopics: [],
      },
    };
    const result = createTopicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject empty subtopics', () => {
    const invalidData = {
      title: 'Test Topic',
      description: 'This is a test topic description',
      lessonPlan: {
        ...validLessonPlan,
        mainTopics: [{
          name: 'Main Topic 1',
          subtopics: [],
        }],
      },
    };
    const result = createTopicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid subtopic status', () => {
    const invalidData = {
      title: 'Test Topic',
      description: 'This is a test topic description',
      lessonPlan: {
        ...validLessonPlan,
        mainTopics: [{
          name: 'Main Topic 1',
          subtopics: [{
            name: 'Subtopic 1',
            status: 'invalid-status' as any,
          }],
        }],
      },
    };
    const result = createTopicSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

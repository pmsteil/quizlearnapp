import { z } from 'zod';

const subtopicSchema = z.object({
  name: z.string().min(1, 'Subtopic name is required'),
  status: z.enum(['not-started', 'in-progress', 'current', 'completed', 'upcoming']),
  icon: z.string().optional(),
});

const mainTopicSchema = z.object({
  name: z.string().min(1, 'Main topic name is required'),
  subtopics: z.array(subtopicSchema).min(1, 'At least one subtopic is required'),
});

const lessonPlanSchema = z.object({
  mainTopics: z.array(mainTopicSchema).min(1, 'At least one main topic is required'),
  currentTopic: z.string(),
  completedTopics: z.array(z.string()),
});

export const createTopicSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  lessonPlan: lessonPlanSchema,
});

export const updateTopicSchema = createTopicSchema;

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

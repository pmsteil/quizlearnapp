import { z } from 'zod';

export const recordProgressSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  isCorrect: z.boolean(),
});

export type RecordProgressInput = z.infer<typeof recordProgressSchema>;

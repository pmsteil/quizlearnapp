import { z } from 'zod';

export const createQuestionSchema = z.object({
  text: z.string().min(10, 'Question text must be at least 10 characters'),
  options: z.array(z.string())
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed'),
  correctAnswer: z.number()
    .min(0, 'Correct answer index must be non-negative')
    .refine(val => Number.isInteger(val), 'Correct answer must be an integer'),
  explanation: z.string().min(20, 'Explanation must be at least 20 characters'),
});

export const updateQuestionSchema = createQuestionSchema;

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

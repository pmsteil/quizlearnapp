import { recordProgressSchema } from '../progress';

describe('Progress Validation', () => {
  it('should validate valid progress data', () => {
    const validData = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      isCorrect: true,
    };
    const result = recordProgressSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const invalidData = {
      questionId: 'not-a-uuid',
      isCorrect: true,
    };
    const result = recordProgressSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject non-boolean isCorrect', () => {
    const invalidData = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      isCorrect: 'true' as any,
    };
    const result = recordProgressSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

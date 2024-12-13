import { createQuestionSchema } from '../questions';

describe('Questions Validation', () => {
  it('should validate valid question data', () => {
    const validData = {
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 1,
      explanation: 'Paris is the capital and largest city of France.',
    };
    const result = createQuestionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject short question text', () => {
    const invalidData = {
      text: 'Short?',
      options: ['Yes', 'No'],
      correctAnswer: 0,
      explanation: 'This is a detailed explanation of the answer.',
    };
    const result = createQuestionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject too few options', () => {
    const invalidData = {
      text: 'What is the capital of France?',
      options: ['Paris'],
      correctAnswer: 0,
      explanation: 'This is a detailed explanation of the answer.',
    };
    const result = createQuestionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject too many options', () => {
    const invalidData = {
      text: 'What is the capital of France?',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      correctAnswer: 0,
      explanation: 'This is a detailed explanation of the answer.',
    };
    const result = createQuestionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject negative correct answer index', () => {
    const invalidData = {
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: -1,
      explanation: 'This is a detailed explanation of the answer.',
    };
    const result = createQuestionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer correct answer', () => {
    const invalidData = {
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 1.5,
      explanation: 'This is a detailed explanation of the answer.',
    };
    const result = createQuestionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject short explanation', () => {
    const invalidData = {
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 1,
      explanation: 'Short.',
    };
    const result = createQuestionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

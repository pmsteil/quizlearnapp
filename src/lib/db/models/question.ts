import { db } from '../client';
import { generateId } from '../../utils/auth';

export interface Question {
  id: string;
  topicId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionModel {
  static async create(
    topicId: string,
    text: string,
    options: string[],
    correctAnswer: number,
    explanation: string
  ): Promise<Question> {
    const id = generateId();
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await db.execute({
        sql: `INSERT INTO questions (id, topic_id, text, options, correct_answer, explanation, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              RETURNING *`,
        args: [id, topicId, text, JSON.stringify(options), correctAnswer, explanation, timestamp, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to create question');
      }

      return this.mapQuestion(result.rows[0]);
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  static async getByTopicId(topicId: string): Promise<Question[]> {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM questions WHERE topic_id = ? ORDER BY created_at ASC',
        args: [topicId]
      });

      return (result.rows || []).map(this.mapQuestion);
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  }

  private static mapQuestion(row: any): Question {
    return {
      id: row.id,
      topicId: row.topic_id,
      text: row.text,
      options: JSON.parse(row.options),
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }
}

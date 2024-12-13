import { QuestionModel, type Question } from '../db/models/question';
import { ProgressModel, type Progress } from '../db/models/progress';

export class QuestionService {
  static async createQuestion(
    topicId: string,
    text: string,
    options: string[],
    correctAnswer: number,
    explanation: string
  ): Promise<Question> {
    return await QuestionModel.create(topicId, text, options, correctAnswer, explanation);
  }

  static async getTopicQuestions(topicId: string): Promise<Question[]> {
    return await QuestionModel.getByTopicId(topicId);
  }

  static async recordAnswer(
    userId: string,
    topicId: string,
    questionId: string,
    isCorrect: boolean
  ): Promise<Progress> {
    return await ProgressModel.create(userId, topicId, questionId, isCorrect);
  }

  static async addInitialQuestions(topicId: string): Promise<void> {
    const questions = [
      {
        text: "What is the purpose of a function in programming?",
        options: [
          "To make the code look prettier",
          "To organize and reuse code",
          "To make the program run slower",
          "To use more memory"
        ],
        correctAnswer: 1,
        explanation: "Functions are blocks of reusable code that help organize your program and avoid repetition."
      },
      {
        text: "Which of these is a valid function declaration?",
        options: [
          "function = myFunction() { }",
          "def myFunction() { }",
          "function myFunction() { }",
          "func myFunction() { }"
        ],
        correctAnswer: 2,
        explanation: "In JavaScript, we declare functions using the 'function' keyword followed by the function name and parentheses."
      },
      {
        text: "What is a return value?",
        options: [
          "A value that is printed to the console",
          "A value that is sent back from a function",
          "A value that is stored in a variable",
          "A value that is deleted"
        ],
        correctAnswer: 1,
        explanation: "A return value is the value that a function sends back to the code that called it."
      },
      {
        text: "What are parameters in a function?",
        options: [
          "Special variables that store the function's name",
          "Values that the function sends back",
          "Variables that hold input values for the function",
          "Special keywords in programming"
        ],
        correctAnswer: 2,
        explanation: "Parameters are variables listed in the function definition that allow you to pass values into the function."
      },
      {
        text: "What happens if a function doesn't have a return statement?",
        options: [
          "It returns null",
          "It returns undefined",
          "It returns 0",
          "It causes an error"
        ],
        correctAnswer: 1,
        explanation: "If a function doesn't explicitly return a value using the return statement, it automatically returns undefined."
      }
    ];

    for (const q of questions) {
      await this.createQuestion(
        topicId,
        q.text,
        q.options,
        q.correctAnswer,
        q.explanation
      );
    }
  }
}

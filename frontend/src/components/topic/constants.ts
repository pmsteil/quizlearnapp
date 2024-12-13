import type { Message } from '@/lib/types';

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    type: 'question',
    content: '',
    question: {
      id: 1,
      text: "What is the correct way to define a function in Python that takes two parameters?",
      options: [
        "function add(a, b) { return a + b }",
        "def add(a, b): return a + b",
        "def add(a, b) { return a + b }",
        "function add(a, b): return a + b"
      ],
      correctAnswer: 1,
      explanation: "In Python, we use the 'def' keyword to define functions, followed by the function name and parameters in parentheses. The function body is indented and can use 'return' to send back a value."
    }
  },
  {
    id: 2,
    type: 'user',
    content: "I think it's 'function add(a, b) { return a + b }'",
    selectedAnswer: 0,
    isCorrect: false
  },
  {
    id: 3,
    type: 'ai',
    content: "That's not quite right. The syntax you provided is actually JavaScript syntax. In Python, we use the 'def' keyword to define functions, and we use a colon ':' instead of curly braces to mark the function body. The correct syntax is:\n\ndef add(a, b):\n    return a + b\n\nThis follows Python's clean and readable syntax style where indentation is used to define code blocks instead of curly braces. Would you like to try another example?"
  }
];
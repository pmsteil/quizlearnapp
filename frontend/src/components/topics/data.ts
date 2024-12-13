export interface Topic {
  id: number;
  name: string;
  description: string;
  progress: number;
  lastActivity: string;
  correctAnswers: number;
  incorrectAnswers: number;
  level: string;
}

export const topics: Topic[] = [
  {
    id: 1,
    name: 'Python Advanced Concepts',
    description: 'Decorators, Generators, and Context Managers',
    progress: 65,
    lastActivity: '2 hours ago',
    correctAnswers: 124,
    incorrectAnswers: 23,
    level: 'Advanced',
  },
  {
    id: 2,
    name: 'React Hooks Deep Dive',
    description: 'Custom Hooks and Advanced Patterns',
    progress: 45,
    lastActivity: '1 day ago',
    correctAnswers: 89,
    incorrectAnswers: 31,
    level: 'Intermediate',
  },
  {
    id: 3,
    name: 'TypeScript Generics',
    description: 'Advanced Type System Features',
    progress: 90,
    lastActivity: '3 hours ago',
    correctAnswers: 156,
    incorrectAnswers: 12,
    level: 'Expert',
  },
  {
    id: 4,
    name: 'Node.js Microservices',
    description: 'Building Scalable Architecture',
    progress: 30,
    lastActivity: '5 days ago',
    correctAnswers: 45,
    incorrectAnswers: 28,
    level: 'Beginner',
  },
  {
    id: 5,
    name: 'GraphQL Fundamentals',
    description: 'Queries, Mutations, and Subscriptions',
    progress: 15,
    lastActivity: '1 week ago',
    correctAnswers: 23,
    incorrectAnswers: 19,
    level: 'Beginner',
  }
];
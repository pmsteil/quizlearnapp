import {
  Guitar, Music, BookOpen, Settings, Users,
  Headphones, Music2, Hash, Clock
} from 'lucide-react';
import type { Topic } from '@/lib/types';

export const ACTIVE_TOPICS: Topic[] = [
  {
    id: "1",
    title: 'Python Basics',
    description: 'Learn Python fundamentals',
    progress: 75,
    user_id: "1",
    lesson_plan: {
      mainTopics: [],
      currentTopic: '',
      completedTopics: []
    },
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  },
  {
    id: "2",
    title: 'JavaScript ES6+',
    description: 'Master modern JavaScript',
    progress: 45,
    user_id: "1",
    lesson_plan: {
      mainTopics: [],
      currentTopic: '',
      completedTopics: []
    },
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  },
  {
    id: "3",
    title: 'React Hooks',
    description: 'Learn React hooks in depth',
    progress: 90,
    user_id: "1",
    lesson_plan: {
      mainTopics: [],
      currentTopic: '',
      completedTopics: []
    },
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  },
];

export const GUITAR_LEARNING_PLAN = {
  mainTopics: [
    {
      name: "Guitar Basics",
      icon: Guitar,
      subtopics: [
        { name: "Parts of the Guitar", icon: Settings },
        { name: "Proper Posture", icon: Users },
        { name: "Tuning Basics", icon: Music },
        { name: "String Names", icon: BookOpen },
        { name: "Finger Placement", icon: Headphones },
        { name: "Basic Maintenance", icon: Settings },
        { name: "Reading TAB", icon: BookOpen },
        { name: "Guitar Picks", icon: Music2 },
        { name: "Sound Production", icon: Hash },
        { name: "Practice Routine", icon: Clock }
      ]
    }
  ]
};

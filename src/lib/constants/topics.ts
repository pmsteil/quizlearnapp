import { 
  Guitar, Music, Mic2, BookOpen, Settings, Users, 
  Headphones, Hash, Pencil, Clock,
  GanttChartSquare, ArrowRightLeft, Play, Music2,
  Repeat, NotebookPen, MusicIcon, Heart, Star
} from 'lucide-react';
import type { Topic } from '../types';

export const ACTIVE_TOPICS: Topic[] = [
  { id: 1, name: 'Python Basics', progress: 75, status: 'on-track', lastActivity: '2h ago' },
  { id: 2, name: 'JavaScript ES6+', progress: 45, status: 'behind', lastActivity: '1d ago' },
  { id: 3, name: 'React Hooks', progress: 90, status: 'ahead', lastActivity: '3h ago' },
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
    },
    // ... rest of the topics
  ]
};
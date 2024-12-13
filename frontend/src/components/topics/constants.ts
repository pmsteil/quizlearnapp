import {
  Guitar, Music, Mic2, BookOpen, Settings, Users,
  Headphones, Radio, Pencil, Clock,
  GanttChartSquare, ArrowRightLeft, Play, Music2,
  Repeat, MusicIcon, Heart, Star,
  Hash // Replacing Radio4 with Hash
} from 'lucide-react';
import type { Message } from '@/lib/types';

export const INITIAL_SETUP_MESSAGES: Message[] = [
  {
    id: 1,
    type: 'ai',
    content: "I see you want to learn to play the guitar! That's exciting! To create the perfect learning plan for you, I need to understand a few things. First, what's your main goal with learning guitar? For example:\n\n- Play songs for friends and family\n- Join or start a band\n- Write your own music\n- Learn as a hobby\n\nWhat's your primary motivation?"
  },
  {
    id: 2,
    type: 'user',
    content: "I'd love to be able to play songs for friends and family! I've always wanted to be able to play at gatherings and maybe even write some simple songs eventually."
  },
  {
    id: 3,
    type: 'ai',
    content: "That's a great goal! Playing for friends and family can be really rewarding. Could you tell me about your current experience level with guitar? Have you ever played before, or are you completely new to the instrument?"
  },
  {
    id: 4,
    type: 'user',
    content: "I'm completely new to guitar. I've played piano a bit when I was younger, so I understand some basic music theory, but I've never held a guitar before."
  },
  {
    id: 5,
    type: 'ai',
    content: "Thanks for sharing that! Your piano background will definitely help with understanding rhythm and notes. I've created an initial learning plan tailored to your goals. We'll start with the absolute basics and progress towards playing simple songs. How much time can you dedicate to practice each week?"
  }
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
        { name: "Sound Production", icon: Radio },
        { name: "Practice Routine", icon: Clock }
      ]
    },
    {
      name: "Essential Chords",
      icon: MusicIcon,
      subtopics: [
        { name: "A Major Chord", icon: Music },
        { name: "D Major Chord", icon: Music2 },
        { name: "G Major Chord", icon: Radio },
        { name: "E Minor Chord", icon: Hash }, // Changed from Radio4 to Hash
        { name: "C Major Chord", icon: Music },
        { name: "Chord Diagrams", icon: GanttChartSquare },
        { name: "Transitions", icon: ArrowRightLeft },
        { name: "Strumming", icon: Play },
        { name: "Rhythm Basics", icon: Music2 },
        { name: "Practice Songs", icon: Heart }
      ]
    },
    {
      name: "First Songs",
      icon: Mic2,
      subtopics: [
        { name: "Easy Folk Songs", icon: Music },
        { name: "Pop Basics", icon: Radio },
        { name: "Campfire Songs", icon: Star },
        { name: "Simple Melodies", icon: Music2 },
        { name: "Basic Fingerpicking", icon: Headphones },
        { name: "Song Structure", icon: GanttChartSquare },
        { name: "Playing & Singing", icon: Mic2 },
        { name: "Performance Tips", icon: Users },
        { name: "Song Writing", icon: Pencil },
        { name: "Practice Methods", icon: Repeat }
      ]
    }
  ]
};

import { Brain, Clock, BookOpen } from 'lucide-react';
import type { Metric } from '../types';

export const FOOTER_METRICS: Metric[] = [
  {
    icon: Brain,
    label: 'Questions Answered',
    value: '1,234',
  },
  {
    icon: Clock,
    label: 'Learning Time',
    value: '48h 23m',
  },
  {
    icon: BookOpen,
    label: 'Active Topics',
    value: '5',
  },
];
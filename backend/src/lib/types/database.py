from datetime import datetime
from typing import List, Optional, TypedDict

class User:
    id: str
    email: str
    name: str
    roles: List[str]
    createdAt: datetime
    updatedAt: datetime

class DatabaseConfig:
    url: str
    authToken: Optional[str]

class Topic:
    id: str
    userId: str
    title: str
    description: str
    progress: int
    lessonPlan: 'LessonPlan'
    createdAt: datetime
    updatedAt: datetime

class LessonPlan:
    mainTopics: List['MainTopic']
    currentTopic: str
    completedTopics: List[str]

class MainTopic:
    name: str
    subtopics: List['Subtopic']

class Subtopic:
    name: str
    status: str  # 'not-started' | 'in-progress' | 'current' | 'completed' | 'upcoming'
    icon: Optional[str]

class Question:
    id: str
    topicId: str
    text: str
    options: List[str]
    correctAnswer: int
    explanation: str
    createdAt: datetime
    updatedAt: datetime

class Progress:
    id: str
    userId: str
    topicId: str
    questionId: str
    isCorrect: bool
    createdAt: datetime

class TopicProgress(TypedDict):
    correctAnswers: int
    incorrectAnswers: int
    totalQuestions: int
    timeSpentMinutes: int

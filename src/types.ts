export interface DocumentChunk {
  id: string;
  source: string;
  page: string;
  chapter: string;
  content: string;
}

export interface AcademicDocument {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadDate: string;
  chunks: DocumentChunk[];
}

export interface Question {
  id: string;
  question: string;
  options?: string[];
  type: 'mcq' | 'tf' | 'open' | 'scenario';
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface DiagnosticQuiz {
  questions: Question[];
}

export interface QuizEvaluation {
  mastery_score: number;
  weak_topics: string[];
  strong_topics: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  order: number;
  weakTopicRelation?: string;
  isCompleted?: boolean;
}

export interface LessonContent {
  title: string;
  explanation: string;
  keyConcepts: { term: string; definition: string }[];
  examples: string[];
  memoryTips: string[];
}

export interface PerformanceStats {
  progress: number;
  retention: number;
  exam_readiness: number;
}

export interface ExamSession {
  id: string;
  title: string;
  durationMinutes: number;
  questions: Omit<Question, 'correctAnswer' | 'explanation'>[];
}

export interface ExamGrading {
  score: number;
  totalQuestions: number;
  corrections: {
    questionId: string;
    questionText: string;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];
  chaptersPerformance: {
    chapter: string;
    score: number; // percentage
  }[];
  actionPlan: string[];
  estimatedStudyTimeNeeded: string;
  predictedExamScore: number;
}

export interface PodcastSegment {
  speaker: 'Professor' | 'Student';
  text: string;
}

export interface PodcastScript {
  title: string;
  segments: PodcastSegment[];
}

export interface AudiobookChapter {
  title: string;
  text: string;
  transcript: string;
}

export interface WorkflowItem {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  message?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  documents: AcademicDocument[];
  performance: PerformanceStats & { scoreHistory?: number[] };
  learningPath: LearningModule[];
  completedLessons: string[];
  quizHistory: any[];
}


export enum QuestionType {
  MCQ = 'MCQ',
  TF = 'TF',
}

export interface Question {
  questionText: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
}

export interface Quiz {
  questions: Question[];
}

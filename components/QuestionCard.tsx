
import React from 'react';
import type { Question } from '../types';
import { QuestionType } from '../types';

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

interface QuestionCardProps {
  question: Question;
  index: number;
  showAnswer: boolean;
  style?: React.CSSProperties;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, showAnswer, style }) => {
  const getOptionLabel = (optionIndex: number) => String.fromCharCode(65 + optionIndex);

  const questionTypeLabel = question.type === QuestionType.MCQ ? 'Multiple Choice' : 'True / False';

  return (
    <div 
      className="aurora-card question-card animate-fade-in-up"
      style={style}
    >
      <div className="aurora-card-content p-6">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
                <p className="text-lg font-semibold text-white">
                  <span className="text-primary-400 font-bold mr-2">{index + 1}.</span>
                  {question.questionText}
                </p>
            </div>
          <span className="text-xs font-medium bg-slate-700 text-slate-300 px-2 py-1 rounded-full ml-4 flex-shrink-0">{questionTypeLabel}</span>
        </div>
        
        <div className="space-y-3">
          {question.type === QuestionType.MCQ && question.options && (
            question.options.map((option, i) => {
              const isCorrect = option === question.correctAnswer;
              return (
                <div
                  key={i}
                  className={`option flex items-center p-3 rounded-md border text-sm transition-colors duration-200
                    ${showAnswer && isCorrect
                      ? 'correct-answer bg-green-500/10 border-green-500/30 text-green-300 font-semibold'
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  {showAnswer && isCorrect && <CheckCircleIcon />}
                  <span className={`font-bold mr-3 ${showAnswer && isCorrect ? '' : 'text-slate-400'}`}>
                    {getOptionLabel(i)}.
                  </span>
                  <span>{option}</span>
                </div>
              );
            })
          )}

          {question.type === QuestionType.TF && showAnswer && (
            <div className="flex items-center p-3 rounded-md bg-green-500/10 border-green-500/30 text-green-300 font-semibold">
              <CheckCircleIcon />
              Correct Answer: {question.correctAnswer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

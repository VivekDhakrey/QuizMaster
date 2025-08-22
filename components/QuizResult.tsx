
import React, { useCallback, useState } from 'react';
import type { Quiz } from '../types';
import { QuestionCard } from './QuestionCard';
import { DownloadIcon } from './icons/DownloadIcon';
import { PrintIcon } from './icons/PrintIcon';
import { CopyIcon } from './icons/CopyIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface QuizResultProps {
  quiz: Quiz;
}

export const QuizResult: React.FC<QuizResultProps> = ({ quiz }) => {
  const [showAnswers, setShowAnswers] = useState(true);
  const [copyStatus, setCopyStatus] = useState('Copy');

  const formatQuizForExport = useCallback((quizData: Quiz, includeAnswers: boolean = true): string => {
    let formattedText = "AI Generated Quiz\n==================\n\n";
    let questionCounter = 1;
    
    const mcqQuestions = quizData.questions.filter(q => q.type === 'MCQ');
    const tfQuestions = quizData.questions.filter(q => q.type === 'TF');

    if (mcqQuestions.length > 0) {
      formattedText += "Multiple Choice Questions\n-------------------------\n\n";
      mcqQuestions.forEach((q) => {
        formattedText += `Q${questionCounter++}: ${q.questionText}\n`;
        if (q.options) {
          q.options.forEach((option, i) => {
            formattedText += `  ${String.fromCharCode(65 + i)}. ${option}\n`;
          });
        }
        if (includeAnswers) {
          formattedText += `\nANSWER: ${q.correctAnswer}\n`;
        }
        formattedText += `\n`;
      });
    }

    if (tfQuestions.length > 0) {
      formattedText += "True/False Questions\n--------------------\n\n";
      tfQuestions.forEach((q) => {
        formattedText += `Q${questionCounter++}: ${q.questionText}\n`;
        if (includeAnswers) {
          formattedText += `\nANSWER: ${q.correctAnswer}\n`;
        }
        formattedText += `\n`;
      });
    }
    
    return formattedText;
  }, []);

  const handleExport = useCallback((format: 'json' | 'txt') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(quiz, null, 2);
      filename = 'quiz.json';
      mimeType = 'application/json';
    } else {
      content = formatQuizForExport(quiz);
      filename = 'quiz.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [quiz, formatQuizForExport]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textToCopy = formatQuizForExport(quiz, showAnswers);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    }, (err) => {
      console.error('Failed to copy text: ', err);
      setCopyStatus('Error');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    });
  };

  if (!quiz || quiz.questions.length === 0) {
    return <p className="text-center text-slate-400">No questions were generated. Try adjusting your source text or prompt.</p>;
  }

  const ActionButton: React.FC<{onClick: () => void; children: React.ReactNode; primary?: boolean}> = ({ onClick, children, primary = false }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border
        ${primary 
          ? 'bg-primary-600/80 text-white border-primary-500/50 hover:bg-primary-600'
          : 'bg-slate-700/50 text-slate-200 border-slate-600/80 hover:bg-slate-700'
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="no-print flex flex-wrap gap-3 justify-center items-center p-3 rounded-xl bg-slate-900/50 border border-white/10">
          <ActionButton onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? <EyeSlashIcon className="w-5 h-5 mr-2" /> : <EyeIcon className="w-5 h-5 mr-2" />}
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </ActionButton>
          <ActionButton onClick={handleCopy}>
              <CopyIcon className="w-5 h-5 mr-2" />
              {copyStatus}
          </ActionButton>
          <ActionButton onClick={handlePrint}>
              <PrintIcon className="w-5 h-5 mr-2" />
              Print
          </ActionButton>
          <ActionButton onClick={() => handleExport('txt')}>
              <DownloadIcon className="w-5 h-5 mr-2" />
              TXT
          </ActionButton>
          <ActionButton onClick={() => handleExport('json')} primary>
            <DownloadIcon className="w-5 h-5 mr-2" />
            JSON
          </ActionButton>
      </div>
      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <QuestionCard 
            key={index} 
            question={question}
            showAnswer={showAnswers}
            index={index} 
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
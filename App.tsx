
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { QuizForm } from './components/QuizForm';
import { QuizResult } from './components/QuizResult';
import { Spinner } from './components/Spinner';
import { generateQuiz } from './services/geminiService';
import type { Quiz } from './types';

const loadingMessages = [
  "Consulting the AI muses...",
  "Crafting clever questions...",
  "Distilling knowledge into a quiz...",
  "Warming up the thinking cap...",
  "Almost there, preparing your questions!",
];

export interface QuizRequest {
  sourceText: string;
  numMCQ: number;
  numTF: number;
  difficulty: string;
}

const App: React.FC = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const handleGenerateQuiz = useCallback(async (request: QuizRequest) => {
    setIsLoading(true);
    setError(null);
    setQuiz(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      const generatedQuiz = await generateQuiz(request);
      setQuiz(generatedQuiz);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`An error occurred while generating the quiz. Please check your API key and try again. The AI says: "${errorMessage}"`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto grid gap-12">
          <QuizForm onGenerate={handleGenerateQuiz} isLoading={isLoading} />
          
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl" role="alert">
              <strong className="font-bold">Oops! </strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Spinner />
              <p className="mt-4 text-lg text-primary-400 font-semibold animate-pulse">
                {loadingMessage}
              </p>
            </div>
          )}

          <div 
            key={quiz ? JSON.stringify(quiz.questions) : 'no-quiz'}
            className={`transition-opacity duration-700 ease-in-out ${quiz && !isLoading ? 'opacity-100' : 'opacity-0'}`}
          >
            {quiz && !isLoading && (
              <div className="quiz-result-container">
                <h2 className="text-3xl font-bold text-white mb-8 pb-4 text-center">
                  Your Generated Quiz
                </h2>
                <QuizResult quiz={quiz} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
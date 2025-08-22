import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-20 pt-6 no-print">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-3 backdrop-blur-lg bg-slate-900/50 rounded-xl p-3 max-w-sm mx-auto border border-white/10 shadow-lg">
          <SparklesIcon className="h-6 w-6 text-primary-400" />
          <h1 className="text-xl font-bold text-white">
            AI Quiz Creator
          </h1>
        </div>
      </div>
    </header>
  );
};

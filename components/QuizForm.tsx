
import React, { useState, useRef, useCallback } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import type { QuizRequest } from '../App';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker';


interface QuizFormProps {
  onGenerate: (request: QuizRequest) => void;
  isLoading: boolean;
}

const NumberStepper: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled: boolean;
}> = ({ label, value, onChange, min = 0, max = 20, disabled }) => {
  const increment = () => onChange(Math.min(max, value + 1));
  const decrement = () => onChange(Math.max(min, value - 1));

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
        {label}
      </label>
      <div className="flex items-center justify-center space-x-2">
        <button type="button" onClick={decrement} disabled={disabled || value <= min} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <span className="w-12 text-center text-lg font-semibold">{value}</span>
        <button type="button" onClick={increment} disabled={disabled || value >= max} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
};

const DifficultySelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}> = ({ value, onChange, disabled }) => {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  return (
    <div className="flex-1">
       <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
        Difficulty
      </label>
      <div className="flex bg-slate-700 rounded-lg p-1">
        {difficulties.map(level => (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level)}
            className={`w-full py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 disabled:opacity-50
              ${value === level 
                ? 'bg-slate-900 text-primary-300 shadow-sm' 
                : 'text-slate-300 hover:bg-slate-600/50'
              }`
            }
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  )
}

const StepHeader: React.FC<{ number: number; title: string }> = ({ number, title }) => (
    <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-500/20 text-primary-300 font-bold flex items-center justify-center">
            {number}
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
);


export const QuizForm: React.FC<QuizFormProps> = ({ onGenerate, isLoading }) => {
  const [sourceText, setSourceText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [numMCQ, setNumMCQ] = useState(5);
  const [numTF, setNumTF] = useState(3);
  const [difficulty, setDifficulty] = useState('Medium');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText) {
      setError('Please provide content by pasting text or uploading a file.');
      return;
    }
    if (numMCQ === 0 && numTF === 0) {
        setError('Please request at least one question.');
        return;
    }
    
    setError(null);
    onGenerate({ sourceText, numMCQ, numTF, difficulty });
  };
  
  const extractTextFromFile = useCallback(async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
      }
      return fullText;
    } else {
      return file.text();
    }
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    const supportedTypes = ['text/plain', 'application/pdf'];
    if (supportedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.txt')) {
      setIsParsing(true);
      setFileName(selectedFile.name);
      setSourceText('');
      try {
        const text = await extractTextFromFile(selectedFile);
        setSourceText(text);
      } catch (e) {
        setError("Could not read the file. It might be corrupted or in an unsupported format.");
        setFileName(null);
      } finally {
        setIsParsing(false);
      }
    } else {
      setFileName(null);
      setError(`Unsupported file type. Please upload a .txt or .pdf file.`);
    }
  }, [extractTextFromFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(dragging);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e, false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFileSelect(droppedFile);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSourceText(e.target.value);
      if (e.target.value && fileName) {
          setFileName(null); 
      }
  };

  const clearInput = () => {
    setSourceText(''); 
    setFileName(null); 
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  const disableForm = isLoading || isParsing;

  return (
    <div className="aurora-card">
      <div className="aurora-card-content p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
            <StepHeader number={1} title="Provide Content" />
            <div 
                className={`relative border border-dashed rounded-lg transition-all duration-300
                ${isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-slate-600 hover:border-primary-400'}`}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDrop={handleDrop}
            >
                <textarea
                  id="source-text"
                  rows={10}
                  className="w-full p-4 border-none rounded-lg focus:ring-2 focus:ring-primary-500 transition-shadow duration-200 bg-slate-900/50 disabled:opacity-70 placeholder:text-slate-400"
                  placeholder="Paste your chapter text, article, or study notes here..."
                  value={sourceText}
                  onChange={handleTextChange}
                  disabled={disableForm || !!fileName}
                />
                {!sourceText && !fileName && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer" onClick={triggerFileSelect}>
                        <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-400">
                            <span className="font-semibold text-primary-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">Supports: TXT, PDF</p>
                    </div>
                )}
                 {fileName && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-lg">
                        <p className="text-lg font-semibold text-primary-300">{isParsing ? 'Processing...' : 'File Ready'}</p>
                        <p className="text-sm text-slate-400">{fileName}</p>
                    </div>
                )}
                {(sourceText || fileName) && !disableForm && (
                  <button 
                    type="button" 
                    onClick={clearInput} 
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 text-2xl leading-none"
                    aria-label="Clear input"
                  >&times;</button>
                )}
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.pdf" className="hidden" disabled={disableForm} />
            </div>
             {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          
          <StepHeader number={2} title="Configure Quiz" />
          <div className="flex flex-col sm:flex-row gap-6 items-start bg-slate-700/50 p-4 rounded-lg">
              <NumberStepper label="Multiple-Choice" value={numMCQ} onChange={setNumMCQ} disabled={disableForm} />
              <div className="w-full sm:w-px h-px sm:h-auto bg-slate-600 self-stretch"></div>
              <NumberStepper label="True/False" value={numTF} onChange={setNumTF} disabled={disableForm} />
              <div className="w-full sm:w-px h-px sm:h-auto bg-slate-600 self-stretch"></div>
              <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={disableForm} />
          </div>

          <button
            type="submit"
            disabled={disableForm || !sourceText}
            className="w-full flex items-center justify-center bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-lg shadow-primary-700/20 hover:shadow-primary-600/40"
          >
            {isParsing ? (
              'Processing File...'
            ) : isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Quiz
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

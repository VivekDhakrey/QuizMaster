
import { GoogleGenAI, Type } from '@google/genai';
import type { Quiz } from '../types';
import type { QuizRequest } from '../App';


// --- GEMINI AI SETUP ---

// IMPORTANT: API_KEY Security
// In a real-world application, this is not secure. Your API key would be
// visible in the browser's network requests. For this project, we are making
// the API call directly from the client for simplicity. In a production
// environment, you should always have a backend server that makes the API
// call, keeping your key secret.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not set in environment variables. Please ensure it's configured.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "A list of quiz questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    questionText: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['MCQ', 'TF'] },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING }
                },
                required: ["questionText", "type", "correctAnswer"],
            }
        }
    },
    required: ["questions"]
};

export const generateQuiz = async (request: QuizRequest): Promise<Quiz> => {
  const { sourceText, numMCQ, numTF, difficulty } = request;

  if (!sourceText || !sourceText.trim()) {
    throw new Error('Source content is missing.');
  }

  // 1. Construct the prompt for the AI
  const prompt = `
      Based on the following text, please generate a quiz.
      The difficulty of the questions should be: ${difficulty}.
      The quiz should contain exactly ${numMCQ} multiple-choice questions and ${numTF} true/false questions.
      For multiple-choice questions, provide 4 distinct options, with one being clearly correct. The 'correctAnswer' must be an exact match to one of the options.
      For true/false questions, the 'correctAnswer' should be "True" or "False", and the 'options' field should be omitted or null.
      
      Source Text:
      ---
      ${sourceText}
      ---
  `;

  // 2. Call the Gemini API
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7,
        }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson && Array.isArray(parsedJson.questions)) {
        return parsedJson as Quiz;
    } else {
        throw new Error("Invalid response format from API. The AI may have returned an unexpected structure.");
    }
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate quiz: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI model.");
  }
};

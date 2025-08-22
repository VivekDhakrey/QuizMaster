import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';

// --- SETUP ---
const app: express.Application = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- GEMINI AI SETUP ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not set in environment variables.");
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

// --- API ENDPOINT ---
app.post('/api/generate', upload.single('sourceFile'), async (req: Request, res: Response) => {
    const { numMCQ, numTF, sourceText: bodyText } = req.body;
    const file = req.file;

    let sourceText = bodyText;

    // 1. Determine the source text (from file or direct input)
    if (file) {
        try {
            if (file.mimetype === 'application/pdf') {
                const data = await pdf(file.buffer);
                sourceText = data.text;
            } else { // Assume plain text for .txt, .csv etc.
                sourceText = file.buffer.toString('utf-8');
            }
        } catch (error) {
            console.error('Error processing file:', error);
            return res.status(500).json({ error: 'Failed to process the uploaded file.' });
        }
    }

    if (!sourceText || !sourceText.trim()) {
        return res.status(400).json({ error: 'Source content is missing.' });
    }
    
    // 2. Construct the prompt for the AI
    const prompt = `
        Based on the following text, please generate a quiz.
        The quiz should contain exactly ${numMCQ} multiple-choice questions and ${numTF} true/false questions.
        For multiple-choice questions, provide 4 distinct options, with one being clearly correct. The 'correctAnswer' must be an exact match to one of the options.
        For true/false questions, the 'correctAnswer' should be "True" or "False", and the 'options' field should be omitted or null.
        Source Text:
        ---
        ${sourceText}
        ---
    `;

    // 3. Call the Gemini API
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
            res.json(parsedJson);
        } else {
            throw new Error("Invalid response format from API.");
        }
    } catch (error) {
        console.error("Error generating quiz with Gemini:", error);
        res.status(500).json({ error: 'Failed to generate quiz. The model may have returned an invalid format.' });
    }
});

// --- START SERVER ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
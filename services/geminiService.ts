
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionData, QuestionStatus } from "../types";

const SYSTEM_PROMPT = `You are a strict academic quality control auditor and parser.

CORE DIRECTIVE: Support both Multiple Choice Questions (MCQ) and Numerical/Subjective problems. 
KEEP IT SIMPLE. DO NOT use LaTeX or complex math notation.

TASK:
1. PARSE: Extract Question Body, Options (if MCQ), Correct Answer (Index 0-3 for MCQ OR a direct value/string for Numerical), and Solution.
2. AUDIT: Verify accuracy and clarity.
   - For numerical problems, verify the calculation logic in the solution.
   - For MCQs, ensure the correct option index matches the solution.

NOTATION RULES (STRICT):
- NO LaTeX. Use plain text (e.g., "q net", "Delta U", "sqrt(x)").

STRICT REDLINING RULES:
- Use <del> for errors and <ins> for corrections.

INPUT HANDLING:
- If a question has NO options (Numerical Problem), set 'options' to an empty array and provide the 'correctAnswer' as a string.
- If a question HAS options, provide 'correctOptionIndex' (0-3).

OUTPUT:
- Return JSON following the schema.`;

const questionSchemaProperties = {
  status: { type: Type.STRING, enum: ['APPROVED', 'NEEDS_CORRECTION', 'REJECTED'] },
  topic: { type: Type.STRING },
  auditLogs: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['CONCEPTUAL', 'NUMERICAL', 'LOGICAL', 'GRAMMATICAL'] },
        message: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
      },
      required: ['type', 'message', 'severity']
    }
  },
  originalParsed: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctOptionIndex: { type: Type.NUMBER },
      correctAnswer: { type: Type.STRING },
      solution: { type: Type.STRING }
    },
    required: ['question', 'solution']
  },
  redlines: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctAnswer: { type: Type.STRING },
      solution: { type: Type.STRING }
    },
    required: ['question', 'solution']
  },
  clean: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctOptionIndex: { type: Type.NUMBER },
      correctAnswer: { type: Type.STRING },
      solution: { type: Type.STRING }
    },
    required: ['question', 'solution']
  }
};

export const auditRawQuestion = async (rawText: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Parse and Audit this content. Handle both MCQs and Numerical problems (where only Q, Ans, and Solution are given). Remove LaTeX: """ ${rawText} """`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: questionSchemaProperties,
            required: ['status', 'topic', 'auditLogs', 'originalParsed', 'redlines', 'clean']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const auditQuestion = async (q: QuestionData['original']): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Audit this existing question. Support numerical/subjective formats:
    Question: ${q.question}
    Options: ${q.options ? q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join(', ') : 'NONE'}
    Correct Answer/Index: ${q.correctAnswer || q.correctOptionIndex}
    Solution: ${q.solution}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: questionSchemaProperties,
            required: ['status', 'topic', 'auditLogs', 'originalParsed', 'redlines', 'clean']
          }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const auditDocument = async (base64Data: string, mimeType: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const DOCUMENT_AUDIT_PROMPT = `Extract ALL academic questions (MCQs and Numerical Problems) from this file (image or document). 
  For images, use OCR to detect text clearly. If no options are present, extract the Question, correct Answer, and Solution. 
  Replace all complex math with plain text. Return as an array of JSON objects.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } }, 
          { text: DOCUMENT_AUDIT_PROMPT }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: questionSchemaProperties,
            required: ['status', 'topic', 'auditLogs', 'originalParsed', 'redlines', 'clean']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Document/Image Audit Error:", error);
    throw error;
  }
};


import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT = `You are a strict academic quality control auditor for high-stakes examinations (coaching institutes).
Your task is to perform an ERROR-INTOLERANT audit of question papers.

REQUIRED COMPONENTS FOR EVERY QUESTION:
1. Question Text
2. Options (if MCQ)
3. Correct Answer / Marked Option
4. Detailed Solution

AUDIT RULES:
- Identify conceptual, numerical, logical, or grammatical errors.
- Verify if the marked option matches the solution logic.
- Verify numerical calculations step-by-step.
- Produce REDLINES: Use <del>text</del> for errors and <ins>text</ins> for corrections immediately following.
- Produce CLEAN VERSION: The final, error-free, exam-ready version.
- CATEGORIZE errors: CONCEPTUAL, NUMERICAL, LOGICAL, or GRAMMATICAL.

STRICT CONSTRAINTS:
- No creativity. No stylistic rephrasing. Only corrections for accuracy.
- No LaTeX. Use plain text or Unicode.
- If a core component (Question/Options/Answer/Solution) is missing, flag it as a HIGH severity error in the logs.

OUTPUT FORMAT: Return a JSON array of audited questions.`;

const questionSchemaProperties = {
  topic: { type: Type.STRING },
  status: { type: Type.STRING, enum: ['APPROVED', 'NEEDS_CORRECTION', 'REJECTED'] },
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
  redlines: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
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

export const auditRawInput = async (rawText: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Perform a strict audit on these questions. Identify errors, provide redlines and clean versions. Raw input: """ ${rawText} """`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0, // Strict, no creativity allowed
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: questionSchemaProperties,
            required: ['status', 'topic', 'auditLogs', 'redlines', 'clean']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Audit Failure:", error);
    throw error;
  }
};

export const auditDocumentInput = async (base64Data: string, mimeType: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Extract and strictly audit all questions from this document. Ensure Q, Options, Answer, and Solution are extracted. Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
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
            required: ['status', 'topic', 'auditLogs', 'redlines', 'clean']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Document Audit Failure:", error);
    throw error;
  }
};


import { GoogleGenAI, Type } from "@google/genai";
import { QuestionData, QuestionStatus } from "../types";

const SYSTEM_PROMPT = `You are a strict academic quality control auditor. 
Your task is to verify MCQ questions for accuracy, clarity, and logical consistency.

STRICT AUDIT RULES:
1. Question must be unambiguous.
2. Options must be distinct and mutually exclusive.
3. Exactly one option must be correct.
4. The solution must logically derive the correct answer.
5. Identify errors in math, grammar, or conceptual logic.

OUTPUT FORMAT:
- You must provide a JSON response.
- status: APPROVED, NEEDS_CORRECTION, or REJECTED.
- auditLogs: A list of specific errors found.
- redlines: A version where mistakes are wrapped in <del>tags and corrections in <ins>tags.
- clean: A corrected, ready-to-use version.

DO NOT BE CREATIVE. Only correct what is wrong. If it is correct, status is APPROVED.`;

const DOCUMENT_AUDIT_PROMPT = `Extract ALL multiple-choice questions from this document. 
For each question, perform a strict quality audit. 
Identify conceptual, logical, and numerical errors.

Return a JSON array of audited questions.
Each object in the array must match this schema:
{
  "topic": "string",
  "original": {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctOptionIndex": number,
    "solution": "string"
  },
  "audit": {
    "status": "APPROVED" | "NEEDS_CORRECTION" | "REJECTED",
    "auditLogs": [{ "type": "CONCEPTUAL" | "NUMERICAL" | "LOGICAL" | "GRAMMATICAL", "message": "string", "severity": "HIGH" | "MEDIUM" | "LOW" }],
    "redlines": { "question": "string", "options": ["string"], "solution": "string" },
    "clean": { "question": "string", "options": ["string"], "correctOptionIndex": number, "solution": "string" }
  }
}`;

export const auditQuestion = async (q: QuestionData['original']): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Audit this question:
Question: ${q.question}
Options: ${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join(', ')}
Correct Index: ${q.correctOptionIndex}
Solution: ${q.solution}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
              }
            },
            clean: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctOptionIndex: { type: Type.NUMBER },
                solution: { type: Type.STRING }
              }
            }
          },
          required: ['status', 'auditLogs', 'redlines', 'clean']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const auditDocument = async (base64Data: string, mimeType: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: DOCUMENT_AUDIT_PROMPT }
      ],
      config: {
        systemInstruction: "You are a specialized academic paper parser and auditor. You extract MCQs from documents and run quality checks on them.",
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              original: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctOptionIndex: { type: Type.NUMBER },
                  solution: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctOptionIndex', 'solution']
              },
              audit: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, enum: ['APPROVED', 'NEEDS_CORRECTION', 'REJECTED'] },
                  auditLogs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, enum: ['CONCEPTUAL', 'NUMERICAL', 'LOGICAL', 'GRAMMATICAL'] },
                        message: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
                      }
                    }
                  },
                  redlines: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      solution: { type: Type.STRING }
                    }
                  },
                  clean: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctOptionIndex: { type: Type.NUMBER },
                      solution: { type: Type.STRING }
                    }
                  }
                },
                required: ['status', 'auditLogs', 'redlines', 'clean']
              }
            },
            required: ['topic', 'original', 'audit']
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Document Audit Error:", error);
    throw error;
  }
};

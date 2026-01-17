
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionData, QuestionStatus } from "../types";

const SYSTEM_PROMPT = `You are a strict academic quality control auditor and parser. 

TASK:
1. PARSE: Extract the Question Body, Options, Correct Answer (Index 0-3), and Solution from the provided raw text.
2. AUDIT: Verify the extracted content for accuracy, clarity, and logical consistency.

STRICT AUDIT RULES:
- Question must be unambiguous.
- Options must be distinct and mutually exclusive.
- Exactly one option must be correct.
- The solution must logically derive the correct answer.
- Identify errors in math, grammar, or conceptual logic.

MISSING DATA POLICY:
If the input text is missing a Question, Options, or a Solution, set status to 'REJECTED' and note the missing component in the audit logs.

OUTPUT FORMAT:
- You must provide a JSON response.
- status: APPROVED, NEEDS_CORRECTION, or REJECTED.
- topic: Infer a short topic name (e.g., "Physics - Kinematics").
- auditLogs: A list of specific errors or missing components found.
- redlines: A version where mistakes are wrapped in <del>tags and corrections in <ins>tags.
- clean: A corrected, ready-to-use version.
- originalParsed: The raw extracted components before audit.

DO NOT BE CREATIVE. Only correct what is wrong.`;

export const auditRawQuestion = async (rawText: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Parse and Audit this raw text content:
  
  """
  ${rawText}
  """`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
                solution: { type: Type.STRING }
              },
              required: ['question', 'options', 'correctOptionIndex', 'solution']
            },
            redlines: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                solution: { type: Type.STRING }
              },
              required: ['question', 'options', 'solution']
            },
            clean: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctOptionIndex: { type: Type.NUMBER },
                solution: { type: Type.STRING }
              },
              required: ['question', 'options', 'correctOptionIndex', 'solution']
            }
          },
          required: ['status', 'topic', 'auditLogs', 'originalParsed', 'redlines', 'clean']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const auditQuestion = async (q: QuestionData['original']): Promise<any> => {
    // Legacy support for structured inputs
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Audit this question:
    Question: ${q.question}
    Options: ${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join(', ')}
    Correct Index: ${q.correctOptionIndex}
    Solution: ${q.solution}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
    });
    return JSON.parse(response.text);
};

export const auditDocument = async (base64Data: string, mimeType: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const DOCUMENT_AUDIT_PROMPT = `Extract ALL multiple-choice questions from this document. For each question, perform a strict quality audit.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: DOCUMENT_AUDIT_PROMPT }],
      config: {
        systemInstruction: "You are a specialized academic paper parser and auditor.",
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Document Audit Error:", error);
    throw error;
  }
};

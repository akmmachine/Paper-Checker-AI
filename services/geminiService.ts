
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionData, QuestionStatus } from "../types";

const SYSTEM_PROMPT = `You are a strict academic quality control auditor and parser.

CORE DIRECTIVE: KEEP IT SIMPLE. 
DO NOT use LaTeX, Markdown math notation ($...$), or complex symbols. 
Ensure the content is readable as plain text for any teacher or student.

TASK:
1. PARSE: Extract Question Body, Options, Correct Answer (Index 0-3), and Solution.
2. AUDIT: Verify accuracy, clarity, and consistency.
   - Catch numerical mismatches.
   - Identify garbled characters (e.g., "\\nBC" instead of "wBC").
   - Ensure options are clear and distinct.

NOTATION RULES (STRICT):
- NO LaTeX: Do not use $q_{net}$, $\Rightarrow$, $\Delta$, etc.
- USE PLAIN TEXT: Use "q net", "leads to" or "->", "Delta U", "w2", "net heat exchange".
- Simplify scientific variables: Use standard characters (e.g., "wAB" instead of "w subscript AB").

STRICT REDLINING RULES:
- In the 'redlines' field, wrap errors in <del> and corrections in <ins>.
- Example: "The work done is <del>-5000</del> <ins>-500</ins> J".
- Only redline specific changes, do not rewrite entire sentences unless necessary.

MISSING DATA POLICY:
If core components (Question, Options, or Solution) are missing, set status to 'REJECTED'.

OUTPUT:
- Provide a JSON response following the specified schema.
- 'topic' should be specific (e.g., "Physics - Thermodynamics").`;

// Helper for the common question schema
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
};

export const auditRawQuestion = async (rawText: string): Promise<any[]> => {
  // Fix: Use direct API_KEY reference and correct initialization object
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Parse and Audit this content. It may contain one or multiple multiple-choice questions. Extract them all. Remove all complex math notations and use simple text: """ ${rawText} """`;

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
    // Fix: Access .text property directly (not a method)
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const auditQuestion = async (q: QuestionData['original']): Promise<any> => {
    // Fix: Use direct API_KEY reference and correct initialization object
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Audit this existing question. Ensure all complex symbols/LaTeX are replaced with plain text:
    Question: ${q.question}
    Options: ${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join(', ')}
    Correct Index: ${q.correctOptionIndex}
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
  // Fix: Use direct API_KEY reference and correct initialization object
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const DOCUMENT_AUDIT_PROMPT = `Extract ALL multiple-choice questions from this document. Replace all complex math notations/LaTeX with simple plain text (e.g., Delta U instead of symbols). Perform a rigorous audit for each question.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      // Fix: Correctly wrap multiple parts (inlineData + text) in a single Content object
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
    console.error("Gemini Document Audit Error:", error);
    throw error;
  }
};

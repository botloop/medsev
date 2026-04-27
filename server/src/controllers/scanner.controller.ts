/**
 * Scanner Controller
 * Uses Google Gemini vision to extract clinical record fields from an uploaded image
 */

import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return _genAI;
};

const SYSTEM_PROMPT = `You are a medical records transcription assistant for the Philippine Coast Guard.
Extract clinical record information from the provided image of a handwritten or printed clinical document.
Return ONLY a valid JSON object with the following structure (omit fields that are not visible or unclear):

{
  "date": "YYYY-MM-DD",
  "assessmentDateTime": "YYYY-MM-DDTHH:MM",
  "illnessOnsetDateTime": "YYYY-MM-DDTHH:MM",
  "gender": "Male" or "Female",
  "complaint": "chief complaint text",
  "diagnosis": "diagnosis text",
  "treatment": "treatment/management text",
  "physician": "attending physician name",
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": "72",
    "respiratoryRate": "18",
    "temperature": "36.5",
    "spO2": "98",
    "weight": "65",
    "height": "170"
  },
  "physicalExam": "physical examination findings",
  "pmhx": "past medical history",
  "psHx": "past surgical history",
  "fhx": "family history",
  "shx": "social history",
  "allergies": "known allergies",
  "medications": "current medications",
  "covidVaccinated": true or false,
  "covidVaccineDetails": "vaccine brand and dose details",
  "notes": "additional notes or remarks"
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- For numeric vital signs, return only the number as a string (e.g. "72" not "72 bpm")
- For blood pressure, use format "120/80"
- If a field is illegible or absent, omit it entirely
- Dates must be ISO format`;

export const scanClinicalRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'Gemini API key not configured' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    const base64 = file.buffer.toString('base64');
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      { inlineData: { mimeType: file.mimetype, data: base64 } },
    ]);

    const content = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error('Gemini returned non-JSON:', content);
      res.status(422).json({ error: 'Could not parse extracted data. Try a clearer image.' });
      return;
    }

    res.json(extracted);
  } catch (error: any) {
    console.error('Scanner error:', error?.message ?? error);
    res.status(500).json({ error: 'Failed to scan document' });
  }
};

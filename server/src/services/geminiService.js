import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service wrapper for Google Gemini API supporting text, vision, and audio multimodal analysis with fallbacks.
 */
class GeminiService {
  /**
   * Helper to invoke Gemini text model or return fallback if API key/network is unavailable.
   * @param {string} prompt Prompt instructions
   * @param {string} systemInstruction System context
   * @returns {Promise<Object|null>} Structured JSON object or null if failed
   */
  async generateAnalysis(prompt, systemInstruction = '') {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY missing in server env. Using deterministic fallback model.');
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const fullPrompt = `${systemInstruction}\n\nUser Prompt:\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const textResponse = result.response.text();

      try {
        return JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output:', textResponse);
        return null;
      }
    } catch (error) {
      console.error('⚠️  Gemini API Call Failed:', error.message);
      return null;
    }
  }

  /**
   * Helper to invoke Gemini Multimodal model for Vision or Audio inspection.
   * @param {string} prompt Prompt instructions
   * @param {string} mimeType MIME type (e.g. 'image/jpeg', 'audio/mp3', 'audio/wav')
   * @param {string} base64Data Base64 encoded binary data
   * @returns {Promise<Object|null>} Structured JSON object or null if failed
   */
  async generateMultimodalAnalysis(prompt, mimeType, base64Data) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || !base64Data) {
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const part = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, part]);
      const textResponse = result.response.text();

      try {
        return JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Failed to parse Gemini Multimodal JSON output:', textResponse);
        return null;
      }
    } catch (error) {
      console.error('⚠️  Gemini Multimodal API Call Failed:', error.message);
      return null;
    }
  }
}

export const geminiService = new GeminiService();

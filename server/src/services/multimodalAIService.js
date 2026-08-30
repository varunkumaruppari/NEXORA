import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Multimodal AIService Provider Abstraction
 * Supports text NLU, vision inspection, audio analysis, and conversation state synthesis.
 */
class MultimodalAIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
  }

  /**
   * Generates text/JSON analysis via Gemini 1.5 Flash or returns fallback.
   */
  async analyzeText(prompt, systemInstruction = '') {
    if (!this.apiKey) {
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const fullPrompt = `${systemInstruction}\n\nUser Input:\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const textResponse = result.response.text();
      return JSON.parse(textResponse);
    } catch (error) {
      console.warn('⚠️ MultimodalAIService analyzeText fallback:', error.message);
      return null;
    }
  }

  /**
   * Generates visual image evidence inspection via Gemini 1.5 Flash Vision.
   */
  async analyzeImage(prompt, mimeType, base64Data) {
    if (!this.apiKey || !base64Data) {
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
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
      return JSON.parse(textResponse);
    } catch (error) {
      console.warn('⚠️ MultimodalAIService analyzeImage fallback:', error.message);
      return null;
    }
  }

  /**
   * Generates audio evidence / speech transcript evaluation.
   */
  async analyzeAudio(prompt, mimeType, base64Data) {
    if (!this.apiKey || !base64Data) {
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
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
          mimeType: mimeType || 'audio/webm',
        },
      };

      const result = await model.generateContent([prompt, part]);
      const textResponse = result.response.text();
      return JSON.parse(textResponse);
    } catch (error) {
      console.warn('⚠️ MultimodalAIService analyzeAudio fallback:', error.message);
      return null;
    }
  }
}

export const multimodalAIService = new MultimodalAIService();

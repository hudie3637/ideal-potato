
import { GoogleGenAI, Type } from "@google/genai";
import { Category, ClosetItem, BodyMetrics } from "../types";

/**
 * Step 1: Remove Background (using Gemini 2.5 Flash Image)
 */
export const removeBackground = async (base64Image: string): Promise<string> => {
  // Always use a new instance with the direct process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Extract the main clothing item. Remove the background entirely and return only the clothing item on a pure white background. Keep it high quality.' }
      ],
    }
  });

  // Iterate through parts to find the image part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to remove background");
};

/**
 * Step 2: Categorize and Tag (using Gemini 3 Flash)
 */
export const analyzeClosetItem = async (base64Image: string): Promise<Partial<ClosetItem>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Analyze this garment. Identify its category, tags (like summer, casual, beach), and dominant color.' }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: Object.values(Category) },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          color: { type: Type.STRING }
        },
        required: ['category', 'tags', 'color']
      }
    }
  });

  // Use the .text property directly
  return JSON.parse(response.text || '{}');
};

/**
 * Step 3: Body Metric Analysis for 3D Customization
 */
export const analyzeBodyMetrics = async (base64Image: string): Promise<BodyMetrics> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Analyze the person body shape in this photo. Return multipliers (base 1.0) for 3D mesh adjustment: shoulderWidth, waistWidth, and heightRatio. Be realistic.' }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shoulderWidth: { type: Type.NUMBER, description: 'Scale from 0.8 to 1.5' },
          waistWidth: { type: Type.NUMBER, description: 'Scale from 0.8 to 1.5' },
          heightRatio: { type: Type.NUMBER, description: 'Scale from 0.9 to 1.2' }
        },
        required: ['shoulderWidth', 'waistWidth', 'heightRatio']
      }
    }
  });

  // Use the .text property directly
  return JSON.parse(response.text || '{}');
};

/**
 * Step 4: Veo Video Generation for Outfits
 */
export const generateRunwayVideo = async (outfitDescription: string, itemImages: string[]): Promise<string> => {
  // Create a new GoogleGenAI instance right before making an API call for Veo
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `A professional fashion model walking down a runway wearing the following outfit: ${outfitDescription}. Bright studio lighting, 4k cinematic.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    // Wait for operation to complete (standard 10s intervals for Veo)
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  
  // Append API key to fetch from download link
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

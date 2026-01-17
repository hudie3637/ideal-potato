
import { GoogleGenAI, Type } from "@google/genai";
import { Category, ClosetItem } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const resizeImage = async (base64Str: string, maxWidth = 384): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:')) return resolve(base64Str);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};

export const getAIRecommendations = async (items: ClosetItem[]): Promise<any[]> => {
  const ai = getAI();
  const inventorySummary = items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, tags: i.tags }));

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this wardrobe inventory, suggest 3 stylish outfit combinations. 
      Return a JSON array of objects with: name (catchy), review (stylist perspective), score (0-100), scenario (Casual/Work/etc), and itemIds (matching the input IDs).
      Inventory: ${JSON.stringify(inventorySummary)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              review: { type: Type.STRING },
              score: { type: Type.NUMBER },
              scenario: { type: Type.STRING },
              itemIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "review", "score", "scenario", "itemIds"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const analyzeImageForItems = async (base64Image: string): Promise<any[]> => {
  const resized = await resizeImage(base64Image, 512);
  const ai = getAI();
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: resized.split(',')[1], mimeType: 'image/jpeg' } },
          { text: "Identify clothing items. JSON array with name, category, tags, color, season, suggestion." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING, enum: Object.values(Category) },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              color: { type: Type.STRING },
              season: { type: Type.STRING },
              suggestion: { type: Type.STRING }
            },
            required: ["name", "category", "tags", "color", "season", "suggestion"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const removeBackground = async (base64Image: string, targetItem: string): Promise<string> => {
  const resized = await resizeImage(base64Image, 448);
  const ai = getAI();
  try {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: resized.split(',')[1], mimeType: 'image/jpeg' } },
            { text: `Extract garment: "${targetItem}". Transparent background.` }
          ]
        }
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return base64Image;
    });
  } catch { return base64Image; }
};

// Added missing evaluateOutfit function
export const evaluateOutfit = async (items: ClosetItem[]): Promise<{ score: number, review: string }> => {
  const ai = getAI();
  const outfitSummary = items.map(i => ({ name: i.name, category: i.category, color: i.color, tags: i.tags }));

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evaluate this outfit combination: ${JSON.stringify(outfitSummary)}. 
      Return a JSON object with a score (0-100) and a short review from a stylist perspective.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            review: { type: Type.STRING }
          },
          required: ["score", "review"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const generateOutfitPreview = async (items: ClosetItem[], userPhoto?: string): Promise<string> => {
  const ai = getAI();
  const imageParts = await Promise.all(items.map(async (item) => {
    const res = await resizeImage(item.imageUrl, 256);
    return { inlineData: { data: res.split(',')[1], mimeType: 'image/jpeg' } };
  }));
  const userRefPart = userPhoto ? { inlineData: { data: (await resizeImage(userPhoto, 384)).split(',')[1], mimeType: 'image/jpeg' } } : null;
  const prompt = userPhoto ? "Photorealistic fashion photo of this person wearing these clothes." : "Realistic fashion catalog photo of a model wearing these clothes.";
  
  return withRetry(async () => {
    // Fixed contents structure to follow SDK guidelines
    const parts = userRefPart ? [userRefPart, ...imageParts, { text: prompt }] : [...imageParts, { text: prompt }];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Failed");
  });
};


import { GoogleGenAI, Type } from "@google/genai";

// Helper to extract mime type from data URL
const getMimeType = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.*);base64,/);
  return match ? match[1] : "image/jpeg";
};

/**
 * Generates viral thumbnails with professional blending and multilingual support.
 */
export async function generateThumbnailVariation(prompt: string, style: string, assets: string[], variationIndex: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const variationHints = [
    "Close-up focal point, extreme contrast, high-energy lighting, vibrant colors.",
    "Wide cinematic shot, dramatic depth of field, atmospheric lighting, moody shadows.",
    "Action-oriented composition, dynamic elements, bold saturation, attention-grabbing center."
  ];

  // Instructions for multilingual support and professional blending
  const systemPrompt = `
    TASK: Generate a viral, high-CTR (Click-Through Rate) YouTube thumbnail image.
    STYLE: ${style}.
    USER PROMPT (Interpret correctly regardless of language): "${prompt}"
    VARIATION STRATEGY: ${variationHints[variationIndex]}

    CRITICAL INSTRUCTIONS:
    1. LANGUAGE INDEPENDENCE: The user prompt might be in any language (Hindi, Spanish, Japanese, etc.). Understand the emotional and visual intent. 
    2. ASSET BLENDING: If user images (assets) are provided, you MUST use the likeness of the people/objects in those images as the central subjects. Blend them seamlessly into the new environment. Match the lighting, shadows, and color grading of the background to the subjects.
    3. NO TEXT OVERLAY: Do not add any text to the image unless it is part of the natural environment (like a sign).
    4. QUALITY: High definition, cinematic, professional composition. Optimized for small mobile screens.
  `;

  const parts = [
    { text: systemPrompt },
    ...assets.map(base64 => ({
      inlineData: {
        mimeType: getMimeType(base64),
        data: base64.split(',')[1]
      }
    }))
  ];

  try {
    console.log(`[Variation ${variationIndex}] Requesting generation...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            console.log(`[Variation ${variationIndex}] Success: Image received.`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    if (response.text) {
      console.warn(`[Variation ${variationIndex}] Model returned text instead of image:`, response.text);
      throw new Error(`AI Feedback: ${response.text}`);
    }

    throw new Error("No image data returned from model.");
  } catch (error: any) {
    console.error(`[Variation ${variationIndex}] Gemini Image Error:`, error);
    throw new Error(error.message || "Failed to generate thumbnail.");
  }
}

export async function generateVideoSuggestions(prompt: string, style: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User Thumbnail Concept: "${prompt}". Style: "${style}". 
      Generate 3 viral titles (in the same language as the prompt if applicable) and a short description.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 viral titles."
            },
            description: {
              type: Type.STRING,
              description: "A short engaging description."
            }
          },
          required: ["titles", "description"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    return { titles: ["Viral Title 1", "Viral Title 2", "Viral Title 3"], description: "Optimized for the algorithm." };
  }
}

export async function enhancePrompt(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert this simple thumbnail idea into a professional, cinematic visual prompt for an image generator. Keep the language context.\n\nIdea: ${prompt}`,
    });
    return response.text?.trim() || prompt;
  } catch (err) {
    return prompt;
  }
}

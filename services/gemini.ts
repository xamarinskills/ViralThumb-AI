
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

  const systemPrompt = `
    TASK: Generate a viral, high-CTR (Click-Through Rate) YouTube thumbnail image.
    STYLE: ${style}.
    USER PROMPT: "${prompt}"
    VARIATION STRATEGY: ${variationHints[variationIndex]}

    CRITICAL INSTRUCTIONS:
    1. LANGUAGE INDEPENDENCE: Interpret the intent correctly even if prompt is in Hindi/Spanish/etc.
    2. ASSET BLENDING: If user images are provided, use those subjects seamlessly.
    3. NO TEXT OVERLAY: Do not add any text to the image.
    4. QUALITY: 4K, cinematic, high-impact.
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned.");
  } catch (error: any) {
    throw new Error(error.message || "Failed to generate thumbnail.");
  }
}

/**
 * Analyzes the generated images to create 3 unique, high-CTR titles.
 */
export async function generateVideoSuggestions(prompt: string, style: string, images: string[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const parts = [
      { text: `CONTEXT: User prompt was "${prompt}" in style "${style}".
        TASK: Look at these 3 generated thumbnails. For EACH image, generate a unique, highly viral clickbait YouTube title.
        The titles should be in the same language as the user's prompt. 
        Also provide one shared video description.` },
      ...images.map(img => ({
        inlineData: {
          mimeType: getMimeType(img),
          data: img.split(',')[1]
        }
      }))
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 unique clickbait titles, one for each image provided."
            },
            description: {
              type: Type.STRING,
              description: "A short viral description for the video."
            }
          },
          required: ["titles", "description"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Title generation error:", err);
    return { 
      titles: ["Viral Concept A", "Viral Concept B", "Viral Concept C"], 
      description: "Optimized for the algorithm." 
    };
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

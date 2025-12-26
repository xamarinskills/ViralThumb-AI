
import { GoogleGenAI, Type } from "@google/genai";

// Function to generate high-quality YouTube thumbnail variations using Gemini 2.5 Flash Image model
export async function generateThumbnailVariation(prompt: string, style: string, assets: string[], variationIndex: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const variationHints = [
    "Focus on high-contrast lighting and bold facial expressions.",
    "Focus on cinematic depth of field and vibrant environmental colors.",
    "Focus on extreme close-up details and aggressive text-safe composition."
  ];

  const fullPrompt = `High-quality, viral YouTube thumbnail. Style: ${style}. Content: ${prompt}. ${variationHints[variationIndex]}. Cinematic lighting, bold elements, highly saturated, professional composition, attention-grabbing.`;

  const contents = {
    parts: [
      { text: fullPrompt },
      ...assets.map(base64 => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64.split(',')[1]
        }
      }))
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

// Function to generate viral video suggestions based on the thumbnail prompt
export async function generateVideoSuggestions(prompt: string, style: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 3 viral YouTube video titles and a short engaging description for a video based on this thumbnail concept: "${prompt}" in style "${style}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3 high-CTR viral titles."
          },
          description: {
            type: Type.STRING,
            description: "A short, engaging video description."
          }
        },
        required: ["titles", "description"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

// Function to enhance a user's prompt for better image generation results
export async function enhancePrompt(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this short YouTube thumbnail idea into a highly descriptive, cinematic, and professional image generation prompt. Keep it focused on visual elements, composition, and lighting. Output only the enhanced prompt text.\n\nIdea: ${prompt}`,
  });

  return response.text?.trim() || prompt;
}

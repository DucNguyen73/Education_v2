import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, MessageRole } from '../types';

// Initialize Gemini
// NOTE: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Bạn là một hướng dẫn viên du lịch thời gian, chuyên về Lịch Sử Việt Nam và Thế Giới. 
Đối tượng của bạn là học sinh. Hãy trả lời ngắn gọn, thú vị, đầy cảm hứng.
Luôn chia văn bản thành các đoạn nhỏ dễ đọc.
Nếu nói về một sự kiện cụ thể, hãy mô tả sống động như đang xem phim 3D.
`;

export const generateHistoryResponse = async (
  prompt: string, 
  chatHistory: ChatMessage[]
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Convert generic chat history to format usually acceptable, 
    // but for simple one-shot with context, we can just concatenate or use chat session.
    // Here we use a chat session for context retention.
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: prompt
    });

    return result.text || "Xin lỗi, tín hiệu thời gian bị gián đoạn. Vui lòng thử lại.";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return "Hệ thống đang quá tải khi tải dữ liệu lịch sử. Hãy thử lại sau giây lát.";
  }
};

export const generateHistoricalImage = async (prompt: string): Promise<string | undefined> => {
  try {
    // Using gemini-2.5-flash-image for generation as per guide
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
            { text: `Illustration, historical style, detailed, 3d render style, ${prompt}` }
        ]
      },
      config: {
        // No specific image config needed for basic generation in 2.5 flash image model based on guide context
        // But typically we want a clean output.
        // The guide says: "Call generateContent to generate images with nano banana series models"
      }
    });

    // Iterate to find the image part
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return undefined;
  }
};
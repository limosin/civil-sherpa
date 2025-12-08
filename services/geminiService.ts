import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, Language, LANGUAGE_CONFIGS } from "../types";

// Helper for encoding audio
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDocument = async (
  fileBase64: string,
  targetLanguage: Language
): Promise<AnalysisResult> => {
  
  // Detect mime type from base64 header
  const matches = fileBase64.match(/^data:(.+);base64,/);
  let mimeType = 'image/jpeg'; // default fallback
  let cleanBase64 = fileBase64;
  
  if (matches && matches.length > 1) {
    mimeType = matches[1];
    cleanBase64 = fileBase64.replace(matches[0], "");
  }

  const prompt = `
    You are a "Bureaucratic Sherpa" for a person who has low literacy and may find government forms frightening.
    Analyze this document. It could be an image or a PDF (which may have multiple pages).
    
    Target Language: ${targetLanguage}.
    
    1. Identify who sent it (The "Sender").
    2. Determine the Urgency (Low, Medium, High, Critical).
    3. Extract SPECIFIC Action Items. What exactly does the user need to do? (e.g., "Send photo of pay slip", "Go to office").
    4. Write a script called "translatedSpeechText". This is NOT a literal translation. 
       It should be spoken in the local dialect of the ${targetLanguage} language (e.g., if Spanish, use Mexican Spanish dialect if appropriate for general use, simple terms).
       The tone should be: "This is a letter from [Sender]. They need you to [Action] by [Date], or [Consequence]. Do you want me to help you?"
       Keep it simple, direct, and reassuring. No legalese.

    Return the response in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sender: { type: Type.STRING },
          summary: { type: Type.STRING, description: "A very brief, one sentence summary of what the document is." },
          urgency: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                what: { type: Type.STRING },
                when: { type: Type.STRING, nullable: true },
                how: { type: Type.STRING }
              }
            }
          },
          translatedSpeechText: { type: Type.STRING, description: "The spoken script in the target dialect." }
        },
        required: ['sender', 'summary', 'urgency', 'actionItems', 'translatedSpeechText']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text) as AnalysisResult;
};

export const generateSpeech = async (text: string, language: Language): Promise<AudioBuffer> => {
  const voiceName = LANGUAGE_CONFIGS[language].voiceName;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio data generated");
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    audioContext,
    24000,
    1
  );

  return audioBuffer;
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source; // Return source to allow stopping if needed
};
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
    You are a "Civil Rights Shield" and advocate for a vulnerable person (elderly, low-literacy, or in distress). 
    They have received a document that might be bureaucratic, confusing, or predatory (from corporations or the state).

    Your job is to PROTECT them by analyzing this document (Image or PDF).
    
    Target Language: ${targetLanguage}.
    
    1. Identify the Sender.
    2. Determine Urgency.
    3. **TRAP DETECTION**: Look for "fine print," aggressive deadlines, threats of termination, or complex legal language designed to make them give up. List these as 'risks'.
    4. **RIGHTS DETECTION**: What rights do they have? (e.g., "Right to appeal," "Grace period," "Free interpreter"). List these as 'rights'.
    5. **ACTION PLAN**: Specific, simple steps.
    6. **Voice Script**: A comforting, protective script. Speak like a wise, helpful family member. 
       "Don't worry, I've read this. It is from [Sender]. They are trying to say [Summary]. Be careful because [Risks]. But you have the right to [Rights]. Here is what we need to do..."

    Return JSON.
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
          summary: { type: Type.STRING, description: "Simple summary." },
          urgency: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
          risks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Hidden traps, aggressive clauses, or strict deadlines." 
          },
          rights: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Rights the user has (appeal, support, etc)." 
          },
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
          translatedSpeechText: { type: Type.STRING, description: "Comforting script in target dialect." }
        },
        required: ['sender', 'summary', 'urgency', 'actionItems', 'translatedSpeechText', 'risks', 'rights']
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
export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  HINDI = 'Hindi',
  ARABIC = 'Arabic',
  MANDARIN = 'Mandarin',
}

export interface ActionItem {
  what: string;
  when: string | null;
  how: string;
  box_2d?: [number, number, number, number]; // Visual reference
  page?: number;
}

export interface Risk {
  description: string;
  box_2d?: [number, number, number, number]; // Visual reference
  page?: number;
}

export interface Right {
  description: string;
  box_2d?: [number, number, number, number]; // Visual reference
  page?: number;
}

export interface Annotation {
  label: string; // "Sign Here", "Date Here", "Fill Amount"
  type: 'signature' | 'date' | 'input' | 'warning';
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] - normalized 0-1000
  page?: number;
}

export interface AnalysisResult {
  sender: string;
  summary: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  actionItems: ActionItem[];
  translatedSpeechText: string;
  // New fields for the "Shield" persona
  risks: Risk[]; 
  rights: Right[];
  annotations: Annotation[]; // AR-style coordinates for visual guidance
}

export interface VoiceConfig {
  languageCode: string; // e.g., 'en-US'
  voiceName: string; // Gemini voice name, e.g., 'Puck', 'Kore'
}

export const LANGUAGE_CONFIGS: Record<Language, { label: string; flag: string; voiceName: string }> = {
  [Language.ENGLISH]: { label: 'English', flag: '🇺🇸', voiceName: 'Puck' },
  [Language.SPANISH]: { label: 'Español', flag: '🇲🇽', voiceName: 'Kore' },
  [Language.FRENCH]: { label: 'Français', flag: '🇫🇷', voiceName: 'Charon' },
  [Language.HINDI]: { label: 'हिंदी', flag: '🇮🇳', voiceName: 'Fenrir' },
  [Language.ARABIC]: { label: 'العربية', flag: '🇸🇦', voiceName: 'Zephyr' },
  [Language.MANDARIN]: { label: '普通话', flag: '🇨🇳', voiceName: 'Puck' },
};
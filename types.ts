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
}

export interface AnalysisResult {
  sender: string;
  summary: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  actionItems: ActionItem[];
  translatedSpeechText: string;
  // New fields for the "Shield" persona
  risks: string[]; // Predatory terms, traps, or severe consequences
  rights: string[]; // What the user is entitled to (appeals, extensions, etc)
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
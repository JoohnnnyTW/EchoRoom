
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ImageGenerationSettings, SettingsContextType } from '../types';
import { DEFAULT_IMAGE_GENERATION_SETTINGS } from '../constants/imageGenerationOptions';

const SETTINGS_STORAGE_KEY = 'echoRoomImageGenSettings';

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ImageGenerationSettings>(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        return {
          gemini: { ...DEFAULT_IMAGE_GENERATION_SETTINGS.gemini, ...parsed.gemini },
          openai: { ...DEFAULT_IMAGE_GENERATION_SETTINGS.openai, ...parsed.openai },
          bfl_ai: { ...DEFAULT_IMAGE_GENERATION_SETTINGS.bfl_ai, ...parsed.bfl_ai },
        };
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
    }
    return DEFAULT_IMAGE_GENERATION_SETTINGS;
  });

  const updateSettings = useCallback((newSettings: Partial<ImageGenerationSettings>) => {
    setSettings(prevSettings => ({
      gemini: { ...prevSettings.gemini, ...newSettings.gemini },
      openai: { ...prevSettings.openai, ...newSettings.openai },
      bfl_ai: { ...prevSettings.bfl_ai, ...newSettings.bfl_ai },
    }));
  }, []);

  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
       // console.log("Settings saved:", settings); // Optional: for debugging
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

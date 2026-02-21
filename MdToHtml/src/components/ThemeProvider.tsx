'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeId, DEFAULT_THEME } from '@/lib/themes';

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export const ThemeProvider = ({ children, defaultTheme = DEFAULT_THEME }: { children: React.ReactNode; defaultTheme?: ThemeId }) => {
  const [theme, setTheme] = useState<ThemeId>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as ThemeId;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // [Mod] Do NOT set global theme on root. 
    // We want to scope the theme to the preview area only, 
    // while keeping the editor UI neutral (or using default).
    // The ThemeSwitcher will control this 'theme' state, 
    // and consumers (EditorPage) will apply data-theme={theme} to the preview container.
    
    // However, we still save to localStorage for persistence.
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

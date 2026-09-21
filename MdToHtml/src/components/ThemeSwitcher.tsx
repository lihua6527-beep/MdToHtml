'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { AVAILABLE_THEMES } from '@/lib/themes';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs font-medium text-text-secondary select-none">主题:</span>
      {AVAILABLE_THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`w-6 h-6 rounded-full transition-all border-2 ${
            theme === t.id
              ? 'border-text-primary scale-110 shadow-md'
              : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
          }`}
          style={{ backgroundColor: t.color }}
          title={t.description}
          aria-label={t.name}
        />
      ))}
    </div>
  );
};

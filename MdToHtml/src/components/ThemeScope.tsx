'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeScopeProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemeScope: React.FC<ThemeScopeProps> = ({ children, className }) => {
  const { theme } = useTheme();

  return (
    <div 
      data-theme={theme} 
      className={`bg-bg-page text-text-primary transition-colors duration-300 ${className || ''}`}
    >
      {children}
    </div>
  );
};

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  const applyTheme = (next: Theme) => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(next);
    try {
      localStorage.setItem('theme', next);
    } catch (_) {}
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored);
        applyTheme(stored);
        return;
      }
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const initial: Theme = prefersDark ? 'dark' : 'light';
      setThemeState(initial);
      applyTheme(initial);
    } catch (_) {
      setThemeState('dark');
      applyTheme('dark');
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem('theme');
        if (!stored) {
          const next: Theme = e.matches ? 'dark' : 'light';
          setThemeState(next);
          applyTheme(next);
        }
      } catch (_) {}
    };
    if (mq?.addEventListener) mq.addEventListener('change', handler);
    return () => {
      if (mq?.removeEventListener) mq.removeEventListener('change', handler);
    };
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


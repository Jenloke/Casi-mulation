import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const THEMES: readonly Theme[] = ['light', 'dark', 'system'];

/** Also read by the inline script in each app's index.html, so the first paint is right. */
export const THEME_STORAGE_KEY = 'casino-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Puts `.dark` on <html> for the chosen theme, following the OS while it is 'system'. */
export function ThemeProvider(props: { children: ReactNode; defaultTheme?: Theme }) {
  const { children, defaultTheme = 'system' } = props;
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? defaultTheme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    if (theme !== 'system') return undefined;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next);
    setThemeState(next);
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing');
  return value;
}

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value);
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private windows); the choice then lasts until the page closes.
  }
}

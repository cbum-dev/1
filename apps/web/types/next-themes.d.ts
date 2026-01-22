declare module "next-themes" {
  import * as React from "react";

  export interface UseThemeProps {
    themes: string[];
    forcedTheme?: string;
    theme?: string;
    systemTheme?: string;
    resolvedTheme?: string;
    defaultTheme?: string;
    setTheme: (theme: string) => void;
    setThemes: (themes: string[]) => void;
    setForcedTheme: (theme?: string) => void;
  }

  export function useTheme(): UseThemeProps;

  export interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    forcedTheme?: string;
    themes?: string[];
    value?: string;
    children: React.ReactNode;
  }

  export const ThemeProvider: React.ComponentType<ThemeProviderProps>;
}

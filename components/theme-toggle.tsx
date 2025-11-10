'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Toggle aria-label="Toggle theme" disabled>
        <Sun className="h-4 w-4" />
      </Toggle>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={(pressed) => {
        setTheme(pressed ? 'dark' : 'light');
      }}
      aria-label="Toggle theme"
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Toggle>
  );
}


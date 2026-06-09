import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${
        isDark
          ? 'border-white/20 bg-white/10 text-yellow-300 hover:bg-white/20'
          : 'border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-12" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300" />
      )}
    </button>
  );
}

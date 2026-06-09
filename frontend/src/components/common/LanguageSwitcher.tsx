import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { locales, languageNames, type Locale } from '../../lib/locales'
import { useTheme } from '../../lib/theme';

export function LanguageSwitcher() {
  const { i18n } = useTranslation(); 
  const locale = i18n.language as Locale;
  const navigate = useNavigate();
  const location = useLocation(); const pathname = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchTo(next: Locale) {
    if (next !== locale) {
      i18n.changeLanguage(next);
      const newPath = pathname.replace(/^\/[^/]+/, `/${next}`);
      navigate(newPath);
    }
    setIsOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 backdrop-blur-sm ${
          isDark 
            ? 'bg-gray-800/50 text-gray-200 ring-1 ring-gray-700 hover:bg-gray-700' 
            : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25'
        }`}
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5" />
        {languageNames[locale]}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 z-50 mt-2 w-32 origin-top-right rounded-xl shadow-lg ring-1 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark 
            ? 'bg-gray-800 ring-white/10' 
            : 'bg-white ring-black/5'
        }`}>
          <div className="py-1">
            {locales.map((cur) => (
              <button
                key={cur}
                onClick={() => switchTo(cur)}
                className={`block w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                  cur === locale
                    ? isDark ? 'bg-primary-900/30 text-primary-400' : 'bg-primary-50 text-primary-600'
                    : isDark ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' : 'text-secondary-900 hover:bg-secondary-50'
                }`}
              >
                {languageNames[cur]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        const themes = ['light', 'dark', 'system'] as const;
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const getIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun size={18} />;
            case 'dark':
                return <Moon size={18} />;
            case 'system':
                return <Monitor size={18} />;
        }
    };

    const getLabel = () => {
        switch (theme) {
            case 'light':
                return 'Light';
            case 'dark':
                return 'Dark';
            case 'system':
                return 'System';
        }
    };

    return (
        <button
            onClick={cycleTheme}
            className="theme-toggle"
            title={`Current theme: ${getLabel()}. Click to cycle.`}
            aria-label={`Theme: ${getLabel()}`}
        >
            {getIcon()}
            <span className="theme-label">{getLabel()}</span>
        </button>
    );
}

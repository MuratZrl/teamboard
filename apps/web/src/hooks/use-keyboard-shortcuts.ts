'use client';

import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (e.key !== 'Escape') return;
      }

      const key = [
        e.ctrlKey || e.metaKey ? 'mod' : '',
        e.shiftKey ? 'shift' : '',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const handler = shortcuts[key] || shortcuts[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

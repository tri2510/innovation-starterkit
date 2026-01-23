"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface TextSelectionState {
  selectedText: string;
  triggerPosition: { x: number; y: number } | null;
  isVisible: boolean;
}

interface TextSelectionContextValue {
  state: TextSelectionState;
  setSelection: (text: string, position: { x: number; y: number }) => void;
  clearSelection: () => void;
  hideToolbar: () => void;
}

const TextSelectionContext = createContext<TextSelectionContextValue | null>(null);

export interface TextSelectionProviderProps {
  children: ReactNode;
  onSelection?: (text: string) => void;
}

const MIN_SELECTION_LENGTH = 3;
const MAX_SELECTION_LENGTH = 1000;
const AUTO_DISMISS_DELAY = 5000;

export function TextSelectionProvider({ children, onSelection }: TextSelectionProviderProps) {
  const [state, setState] = useState<TextSelectionState>({
    selectedText: '',
    triggerPosition: null,
    isVisible: false
  });

  const dismissTimeoutRef = useRef<number | undefined>(undefined);

  // Clear auto-dismiss timeout
  const clearDismissTimeout = useCallback(() => {
    if (dismissTimeoutRef.current !== undefined) {
      window.clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = undefined;
    }
  }, []);

  // Set auto-dismiss timeout
  const setDismissTimeout = useCallback(() => {
    clearDismissTimeout();
    dismissTimeoutRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, isVisible: false }));
    }, AUTO_DISMISS_DELAY) as unknown as number;
  }, [clearDismissTimeout]);

  const setSelection = useCallback((text: string, position: { x: number; y: number }) => {
    setState({
      selectedText: text,
      triggerPosition: position,
      isVisible: true
    });
    setDismissTimeout();
    onSelection?.(text);
  }, [onSelection, setDismissTimeout]);

  const clearSelection = useCallback(() => {
    setState({
      selectedText: '',
      triggerPosition: null,
      isVisible: false
    });
    clearDismissTimeout();
  }, [clearDismissTimeout]);

  const hideToolbar = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
    clearDismissTimeout();
  }, [clearDismissTimeout]);

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const selectedText = selection.toString().trim();

      // Filter by length
      if (selectedText.length < MIN_SELECTION_LENGTH || selectedText.length > MAX_SELECTION_LENGTH) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate toolbar position (above selection, centered)
      const toolbarWidth = 120; // Approximate width
      const toolbarHeight = 40; // Approximate height
      const offset = 8; // 8px gap

      let x = rect.left + rect.width / 2 - toolbarWidth / 2;
      let y = rect.top - toolbarHeight - offset;

      // Boundary checks
      x = Math.max(offset, Math.min(x, window.innerWidth - toolbarWidth - offset));
      y = Math.max(offset, y);

      setSelection(selectedText, { x, y });
    };

    // Clear selection when clicking outside
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-toolbar]')) {
        return;
      }
      clearSelection();
    };

    // Hide toolbar on scroll
    const handleScroll = () => {
      hideToolbar();
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('scroll', handleScroll, true);
      clearDismissTimeout();
    };
  }, [setSelection, clearSelection, hideToolbar, setDismissTimeout, clearDismissTimeout]);

  const contextValue: TextSelectionContextValue = {
    state,
    setSelection,
    clearSelection,
    hideToolbar
  };

  return (
    <TextSelectionContext.Provider value={contextValue}>
      {children}
    </TextSelectionContext.Provider>
  );
}

export function useTextSelection() {
  const context = useContext(TextSelectionContext);
  if (!context) {
    throw new Error('useTextSelection must be used within TextSelectionProvider');
  }
  return context;
}

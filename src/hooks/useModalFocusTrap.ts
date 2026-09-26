import { useEffect, useRef } from 'react';

/**
 * Accessible Focus Trap Hook for Modals & Dialogs
 * 
 * - Traps Tab and Shift+Tab navigation within the dialog container
 * - Automatically focuses the initial focusable element or container upon opening
 * - Closes modal on Escape key press
 * - Restores focus to the triggering element when the modal unmounts/closes
 */
export function useModalFocusTrap(
  isOpen: boolean,
  onClose: () => void,
  options?: {
    initialFocusSelector?: string;
    closeOnEscape?: boolean;
  }
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the element that triggered the modal
    triggerRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus the initial element or container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (options?.initialFocusSelector) {
      const initialEl = container.querySelector<HTMLElement>(options.initialFocusSelector);
      if (initialEl) initialEl.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options?.closeOnEscape !== false) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original trigger element
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, options]);

  return containerRef;
}

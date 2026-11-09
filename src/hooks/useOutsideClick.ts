import { useEffect, type RefObject } from 'react';

/** Calls `onOutsideClick` when a pointer press happens outside of the element. */
export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
  isActive = true,
): void {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const element = ref.current;
      if (element && !element.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [ref, onOutsideClick, isActive]);
}

import { useEffect, useRef } from "react";

type Handler = () => void;

/**
 * Hook that handles clicks outside of the referenced element
 * @param handler Function to call when a click outside is detected
 * @returns Ref to attach to the element
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
  handler: Handler
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handler]);

  return ref;
}

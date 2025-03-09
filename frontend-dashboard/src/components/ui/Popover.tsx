import React, { useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface PopoverProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  ({ children, open, onOpenChange }, ref) => {
    return (
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    );
  }
);
Popover.displayName = "Popover";

export interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, asChild }, ref) => {
    if (asChild) {
      return children;
    }

    return (
      <button ref={ref} type="button" className="inline-flex w-full">
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

export interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, className }, forwardedRef) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          const popover = ref.current.closest('[role="dialog"]');
          if (popover) {
            const trigger = document.querySelector(`[aria-controls="${popover.id}"]`);
            if (trigger) {
              (trigger as HTMLElement).click();
            }
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div
        ref={(node) => {
          // Handle both the forwarded ref and our local ref
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
          ref.current = node;
        }}
        role="dialog"
        className={cn(
          "absolute z-50 w-full min-w-[8rem] overflow-hidden rounded-md bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = "PopoverContent"; 
import React from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "animate-pulse rounded-md bg-gray-200 border-2 border-black",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

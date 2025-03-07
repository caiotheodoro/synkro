import React from 'react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-green-100',
  iconColor = 'text-green-600',
  className,
}) => {
  return (
    <div 
      className={cn(
        "bg-white border-[3px] border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      <div className="p-6 flex items-center">
        <div className={cn("rounded-full p-3 mr-4", iconBgColor)}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
}; 
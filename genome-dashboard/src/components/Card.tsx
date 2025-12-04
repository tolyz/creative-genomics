import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className, ...props }) => {
  return (
    <div className={twMerge("bg-white shadow rounded-lg p-6", className)} {...props}>
      {title && <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
};


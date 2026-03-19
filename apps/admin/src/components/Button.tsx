import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

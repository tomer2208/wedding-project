import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const Button = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className={`
        flex items-center justify-center rounded-full 
        bg-wedding-dark border-2 border-wedding-dark 
        text-wedding-beige font-bold transition-all 
        hover:bg-stone-800 hover:border-stone-800 hover:text-white 
        shadow-sm px-8 py-3 
        ${className}
      `}
    >
      {children}
    </button>
  );
};

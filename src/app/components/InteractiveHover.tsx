'use client';

import React, { useRef } from 'react';

export default function InteractiveHover({
  children,
  className = '',
  as: Component = 'div',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  [key: string]: any;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <Component
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden group ${className}`}
      {...props}
    >
      {/* Premium Spotlight overlay that follows the cursor inside the card */}
      <div 
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(400px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(92,19,31,0.06),transparent_80%)]" 
        aria-hidden="true"
      />
      <div 
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border border-gold/15 rounded-[inherit] [mask-image:radial-gradient(250px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),black,transparent)]" 
        aria-hidden="true"
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </Component>
  );
}

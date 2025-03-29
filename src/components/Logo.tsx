
import React from 'react';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/lovable-uploads/bab173aa-cc32-45ab-95b9-882661d1d422.png" 
        alt="Learn With AI Logo" 
        className={`${sizes[size]} object-contain`}
      />
      <span className={`font-bold text-lwai-deepBlue ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'}`}>
        Learn With AI
      </span>
    </div>
  );
};

export default Logo;

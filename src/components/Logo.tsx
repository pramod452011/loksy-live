import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  onClick,
}) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none cursor-pointer ${className}`}
    >
      <img
        src="/loksy-logo.png"
        alt="LOKSY - Apni Duniya, Apne Log"
        className={`${heightClasses} w-auto object-contain max-w-[140px] rounded-lg drop-shadow-md`}
        loading="eager"
      />
    </div>
  );
};

export default Logo;

import React from 'react';

const BaseButton = ({
  onClick,
  icon,
  buttonProps,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  icon: React.ReactElement;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) => {
  return (
    <div className='flex self-end lg:self-center justify-center gap-3 md:gap-4 visible'>
      <button
        className='p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200'
        style={{ 
          color: document.documentElement.classList.contains('dark') 
            ? 'rgba(255, 255, 255, 0.7)' 
            : 'rgba(0, 0, 0, 0.7)' 
        }}
        onClick={onClick}
        {...buttonProps}
      >
        {icon}
      </button>
    </div>
  );
};

export default BaseButton;

import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchBar = ({
  value,
  handleChange,
  className,
  disabled,
}: {
  value: string;
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
  disabled?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <input
        disabled={disabled}
        type='text'
        className='text-gray-800 dark:text-white placeholder:text-gray-500
  dark:placeholder:text-gray-400 p-5 text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40  disabled:cursor-not-allowed transition-opacity m-0 w-full h-full focus:outline-none rounded shadow-lg'
        placeholder={t('search') as string}
        value={value}
        onChange={(e) => {
          handleChange(e);
        }}
      />
    </div>
  );
};

export default SearchBar;

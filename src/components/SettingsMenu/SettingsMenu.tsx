import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import PopupModal from '@components/PopupModal';
import SettingIcon from '@icon/SettingIcon';
import ThemeSwitcher from '@components/Menu/MenuOptions/ThemeSwitcher';
import LanguageSelector from '@components/LanguageSelector';
import AutoTitleToggle from './AutoTitleToggle';
import AdvancedModeToggle from './AdvencedModeToggle';
import InlineLatexToggle from './InlineLatexToggle';
import PromptLibraryMenu from '@components/PromptLibraryMenu';
import ChatConfigMenu from '@components/ChatConfigMenu';
import EnterToSubmitToggle from './EnterToSubmitToggle';
import TotalTokenCost from './TotalTokenCost';
import AutoFetchModelsToggle from './AutoFetchModelsToggle';
import StorageManager from './StorageManager';
import ApiMenu from '@components/ApiMenu';

const SettingsMenu = () => {
  const { t } = useTranslation();

  const theme = useStore.getState().theme;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <>
      <a
        className='flex py-2 px-2 items-center justify-center rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
        onClick={() => {
          setIsModalOpen(true);
        }}
        aria-label={t('setting') as string}
      >
        <SettingIcon className='w-4 h-4' />
      </a>
      {isModalOpen && (
        <PopupModal
          setIsModalOpen={setIsModalOpen}
          title={t('setting') as string}
          cancelButton={false}
        >
          <div className='p-6 border-b border-gray-200 dark:border-gray-600 flex flex-col items-center gap-4'>
            <div className='flex flex-col items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg w-full'>
              <div className='text-sm font-semibold text-gray-900 dark:text-gray-300'>{t('chatFeatures')}</div>
              
              {/* API設定とチャット設定ボタンを水平に配置 */}
              <div className='flex gap-3'>
                <button
                  className='btn btn-neutral'
                  onClick={() => setIsApiModalOpen(true)}
                >
{t('apiSettings')}
                </button>
                <ChatConfigMenu />
              </div>
              <div className='flex flex-col gap-3'>
                <AutoFetchModelsToggle />
                <AutoTitleToggle />
                <AdvancedModeToggle />
                <InlineLatexToggle />
                <EnterToSubmitToggle />
              </div>
              <LanguageSelector />
              <ThemeSwitcher />
            </div>
            <TotalTokenCost />
            <StorageManager />
          </div>
        </PopupModal>
      )}
      {isApiModalOpen && <ApiMenu setIsModalOpen={setIsApiModalOpen} />}
    </>
  );
};

export default SettingsMenu;
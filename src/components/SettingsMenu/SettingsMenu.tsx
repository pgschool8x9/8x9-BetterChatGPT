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
import TotalTokenCost, { TotalTokenCostToggle } from './TotalTokenCost';
import DisplayChatSizeToggle from './DisplayChatSizeToggle';
import MigrationButton from './MigrationButton';
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
            {/* API設定ボタン - 一番上に配置 */}
            <button
              className='btn btn-neutral'
              onClick={() => setIsApiModalOpen(true)}
            >
              APIキーを設定
            </button>
            <LanguageSelector />
            <ThemeSwitcher />
            <div className='flex flex-col gap-3'>
              <EnterToSubmitToggle />
              <InlineLatexToggle />
              <AdvancedModeToggle />
              <TotalTokenCostToggle />
              <DisplayChatSizeToggle />
              <AutoFetchModelsToggle />
              <AutoTitleToggle />
            </div>
            <TotalTokenCost />
            <StorageManager />
            <div className='grid grid-cols-1 gap-3'>
              <ChatConfigMenu />
              {/* <PromptLibraryMenu /> */}
            </div>
            <MigrationButton />
          </div>
        </PopupModal>
      )}
      {isApiModalOpen && <ApiMenu setIsModalOpen={setIsApiModalOpen} />}
    </>
  );
};

export default SettingsMenu;
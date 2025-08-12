import React from 'react';
import useStore from '@store/store';

import Me from './Me';
import AboutMenu from '@components/AboutMenu';
import ImportExportChat from '@components/ImportExportChat';
import SettingsMenu from '@components/SettingsMenu';
import CollapseOptions from './CollapseOptions';
import GoogleSync from '@components/GoogleSync';
import { TotalTokenCostDisplay } from '@components/SettingsMenu/TotalTokenCost';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

const MenuOptions = () => {
  const hideMenuOptions = useStore((state) => state.hideMenuOptions);
  const countTotalTokens = useStore((state) => state.countTotalTokens);
  return (
    <>
      <CollapseOptions />
      <div
        className={`${
          hideMenuOptions ? 'max-h-0' : 'max-h-full'
        } overflow-hidden transition-all`}
      >
        {/* トークン表示と設定を同じ行に配置 */}
        <div className='flex items-center justify-between'>
          <div>
            {countTotalTokens && <TotalTokenCostDisplay />}
          </div>
          <div>
            <SettingsMenu />
          </div>
        </div>
        {googleClientId && <GoogleSync clientId={googleClientId} />}
        {/* <AboutMenu /> */}
        {/* <ImportExportChat /> */}
        {/* <Me /> */}
      </div>
    </>
  );
};

export default MenuOptions;

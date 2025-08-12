import React from 'react';
import useStore from '@store/store';

import ChatContent from './ChatContent';

const Chat = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const menuWidth = useStore((state) => state.menuWidth);

  return (
    <div
      className={`flex h-full flex-1 flex-col`}
      style={{ paddingLeft: hideSideMenu ? '0' : `${menuWidth}px` }}
    >
      <main className='relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1'>
        <ChatContent />
      </main>
    </div>
  );
};

export default Chat;

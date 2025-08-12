import React from 'react';
import useStore from '@store/store';

import Avatar from './Avatar';
import MessageContent from './MessageContent';

import { ContentInterface, Role } from '@type/chat';
import RoleSelector from './RoleSelector';

// const backgroundStyle: { [role in Role]: string } = {
//   user: 'dark:bg-gray-800',
//   assistant: 'bg-gray-50 dark:bg-gray-650',
//   system: 'bg-gray-50 dark:bg-gray-650',
// };
const Message = React.memo(
  ({
    role,
    content,
    messageIndex,
    sticky = false,
  }: {
    role: Role;
    content: ContentInterface[],
    messageIndex: number;
    sticky?: boolean;
  }) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    const advancedMode = useStore((state) => state.advancedMode);

    // チャット風レイアウト: userは右側、assistantは左側
    const isUser = role === 'user';
    const isSystem = role === 'system';

    // stickyの場合は入力エリア用のレイアウト
    if (sticky) {
      return (
        <div className="w-full">
          <MessageContent
            role={role}
            content={content}
            messageIndex={messageIndex}
            sticky={sticky}
          />
        </div>
      );
    }

    return (
      <div className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800">
        <div
          className={`flex gap-3 ${
            hideSideMenu
              ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
              : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
          } mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          {/* アバター削除 */}
          
          {/* メッセージ吹き出し */}
          <div 
            className={`${
              isUser ? 'max-w-[70%]' : 'w-full md:max-w-[90%]'
            } rounded-2xl px-4 py-3 ${
              isUser 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-sm ml-auto' 
                : isSystem
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                : 'bg-transparent text-gray-900 dark:text-gray-100'
            }`}
          >
            {/* RoleSelector非表示化 */}
            <MessageContent
              role={role}
              content={content}
              messageIndex={messageIndex}
              sticky={sticky}
            />
          </div>

          {/* アバター削除 */}
        </div>
      </div>
    );
  }
);

export default Message;

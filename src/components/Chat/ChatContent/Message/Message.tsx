import React, { useState } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import Avatar from './Avatar';
import MessageContent from './MessageContent';
import CopyButton from './View/Button/CopyButton';
import EditButton from './View/Button/EditButton';
import RefreshButton from './View/Button/RefreshButton';

import { ContentInterface, Role, ChatInterface, isTextContent } from '@type/chat';
import { ModelOptions } from '@utils/modelReader';
import RoleSelector from './RoleSelector';
import useSubmit from '@hooks/useSubmit';

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
    model,
  }: {
    role: Role;
    content: ContentInterface[],
    messageIndex: number;
    sticky?: boolean;
    model?: ModelOptions;
  }) => {
    const { t } = useTranslation();
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    const advancedMode = useStore((state) => state.advancedMode);
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const setChats = useStore((state) => state.setChats);
    const chats = useStore((state) => state.chats);
    const lastMessageIndex = useStore((state) =>
      state.chats ? state.chats[state.currentChatIndex].messages.length - 1 : 0
    );

    const { handleSubmit } = useSubmit();
    const [isEdit, setIsEdit] = useState<boolean>(sticky);

    // チャット風レイアウト: userは右側、assistantは左側
    const isUser = role === 'user';
    const isSystem = role === 'system';

    // ボタンハンドラー
    const currentTextContent = isTextContent(content[0]) ? content[0].text : '';
    const handleCopy = () => {
      navigator.clipboard.writeText(currentTextContent);
    };

    const handleRefresh = () => {
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const updatedMessages = updatedChats[currentChatIndex].messages;
      updatedMessages.splice(updatedMessages.length - 1, 1);
      setChats(updatedChats);
      handleSubmit();
    };

    // メッセージ固有のモデル名を取得（assistantメッセージのみ）
    const messageModel = role === 'assistant' && model ? model : null;

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
      <div className="w-full px-4 py-2 bg-white dark:bg-gray-900">
        <div
          className={`flex flex-col gap-3 ${hideSideMenu
            ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
            : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
            } mx-auto`}
        >
          <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* アバター削除 */}

            {/* メッセージ吹き出し */}
            <div
              className={`${isUser ? 'max-w-[70%]' : 'w-full md:max-w-[90%]'
                } rounded-2xl px-4 py-3 ${isUser
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm ml-auto mr-4'
                  : isSystem
                    ? ''
                    : 'bg-transparent text-gray-900 dark:text-gray-100'
                }`}
              style={isSystem ? {
                background: 'linear-gradient(120deg, #ff4757, rgba(182, 139, 247, 1), hsla(237, 85%, 68%, 1.00))',
                backgroundSize: '100% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '500',
                // スマホ対応のフォールバック
                color: 'transparent',
                // より強力なブラウザ対応
                MozBackgroundClip: 'text',
                msBackgroundClip: 'text',
                // 子要素への継承を強制
                '--text-color': 'inherit',
              } as any : undefined}
            >
              {/* RoleSelector非表示化 */}
              {isSystem && (
                <div
                  className="text-lg mb-1 opacity-70 font-semibold"
                  style={{
                    background: 'linear-gradient(120deg, #ff4757, rgba(182, 139, 247, 1), hsla(237, 85%, 68%, 1.00))',
                    backgroundSize: '100% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    MozBackgroundClip: 'text',
                    msBackgroundClip: 'text'
                  } as any}
                >
                  {t('systemRule')}
                </div>
              )}
              <div
                className={isSystem ? 'text-gray-900 dark:text-gray-100' : ''}
                style={isSystem ? {
                  background: 'linear-gradient(120deg, #ff4757, rgba(182, 139, 247, 1), hsla(237, 85%, 68%, 1.00))',
                  backgroundSize: '100% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                  MozBackgroundClip: 'text',
                  msBackgroundClip: 'text',
                  fontWeight: '500',
                } as any : {}}
              >
                <MessageContent
                  role={role}
                  content={content}
                  messageIndex={messageIndex}
                  sticky={sticky}
                  isEdit={isEdit}
                  setIsEdit={setIsEdit}
                />
              </div>
            </div>

            {/* アバター削除 */}
          </div>

          {/* ボタンエリア - メッセージ吹き出しの外側 */}
          <div className={`flex gap-3 ${isUser ? 'justify-end mr-8' : 'justify-start ml-4'}`}>
            <div className={`${isUser ? 'max-w-[70%] ml-auto' : 'w-full md:max-w-[90%]'}`}>
              {/* ユーザー側のボタン */}
              {isUser && (
                <div className="flex items-center gap-2 justify-end">
                  <div className="text-gray-700 dark:text-gray-300">
                    <EditButton setIsEdit={setIsEdit} />
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    <CopyButton onClick={handleCopy} />
                  </div>
                </div>
              )}

              {/* AI側のボタン - メッセージ受信完了時のみ表示 */}
              {!isUser && role === 'assistant' && (
                // 最後のメッセージで生成中の場合は非表示、それ以外は表示
                messageIndex !== lastMessageIndex || !useStore.getState().generating
              ) && (
                  <div className="flex items-center gap-2 justify-start">
                    {messageIndex === lastMessageIndex && (
                      <div className="text-gray-700 dark:text-gray-300">
                        <RefreshButton onClick={handleRefresh} />
                      </div>
                    )}
                    <div className="text-gray-700 dark:text-gray-300">
                      <CopyButton onClick={handleCopy} />
                    </div>
                    {messageModel && (
                      <span className="text-xs text-gray-600 dark:text-gray-200 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                        {messageModel}
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Message;

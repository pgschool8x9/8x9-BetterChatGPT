import React, { useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import ScrollToBottomButton from './ScrollToBottomButton';
import ChatTitle from './ChatTitle';
import Message from './Message';
import CrossIcon from '@icon/CrossIcon';

import useSubmit from '@hooks/useSubmit';
import CloneChat from './CloneChat';
import ShareGPT from '@components/ShareGPT';
import { ImageContentInterface, TextContentInterface } from '@type/chat';
import countTokens, { limitMessageTokens } from '@utils/messageUtils';
import { defaultModel, reduceMessagesToTotalToken } from '@constants/chat';
import { toast } from 'react-toastify';

const ChatContent = () => {
  const { t } = useTranslation();
  const inputRole = useStore((state) => state.inputRole);
  const setError = useStore((state) => state.setError);
  const setChats = useStore((state) => state.setChats);
  const messages = useStore((state) =>
    state.chats &&
    state.chats.length > 0 &&
    state.currentChatIndex >= 0 &&
    state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].messages
      : []
  );
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const stickyIndex = useStore((state) =>
    state.chats &&
    state.chats.length > 0 &&
    state.currentChatIndex >= 0 &&
    state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].messages.length
      : 0
  );
  const advancedMode = useStore((state) => state.advancedMode);
  const generating = useStore.getState().generating;
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const model = useStore((state) =>
    state.chats &&
    state.chats.length > 0 &&
    state.currentChatIndex >= 0 &&
    state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].config.model
      : defaultModel
  );
  const messagesLimited = limitMessageTokens(messages, reduceMessagesToTotalToken, model);

  const handleReduceMessages = () => {
    const confirmMessage = t('reduceMessagesWarning');
    if (window.confirm(confirmMessage)) {
      const updatedChats = JSON.parse(JSON.stringify(useStore.getState().chats));
      const removedMessagesCount = messages.length - messagesLimited.length;
      updatedChats[currentChatIndex].messages = messagesLimited;
      setChats(updatedChats);
      toast.dismiss();
      toast.success(t('reduceMessagesSuccess', { count: removedMessagesCount }));
    }
  };

  useEffect(() => {
    if (!generating) {
      if (messagesLimited.length < messages.length) {
        const hiddenTokens =
          countTokens(messages, model) - countTokens(messagesLimited, model);
        const message = (
          <div>
            <span>
              {t('hiddenMessagesWarning', { hiddenTokens, reduceMessagesToTotalToken })}
            </span><br />
            <button
              onClick={handleReduceMessages}
              className="px-2 py-1 bg-blue-500 text-white rounded"
            >
              {t('reduceMessagesButton')}
            </button>
          </div>
        );
        toast.error(message);
      }
    }
  }, [messagesLimited, generating, messages, model]);

  const saveRef = useRef<HTMLDivElement>(null);

  // clear error at the start of generating new messages
  useEffect(() => {
    if (generating) {
      setError('');
    }
  }, [generating]);

  const { error } = useSubmit();

  return (
    <div className='flex-1 relative overflow-hidden'>
      {/* チャット履歴エリア（全画面） */}
      <div className='absolute inset-0'>
        <ScrollToBottom
          className='h-full bg-transparent'
          followButtonClassName='hidden'
        >
          <ScrollToBottomButton />
          <div className='flex flex-col items-center text-sm bg-transparent'>
            <div
              className='flex flex-col items-center text-sm bg-transparent w-full'
              ref={saveRef}
            >
              <ChatTitle saveRef={saveRef} />
              {/* NewMessageButton非表示化 */}
              {messagesLimited?.map(
                (message, index) =>
                  (advancedMode || index !== 0 || message.role !== 'system') && (
                    <React.Fragment key={index}>
                      <Message
                        role={message.role}
                        content={message.content}
                        messageIndex={index}
                      />
                      {/* NewMessageButton非表示化 */}
                    </React.Fragment>
                  )
              )}
            </div>

            {error !== '' && (
              <div className='relative py-2 px-3 w-3/5 mt-3 max-md:w-11/12 border rounded-md border-red-500 bg-red-500/10'>
                <div className='text-gray-600 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                  {error}
                </div>
                <div
                  className='text-white absolute top-1 right-1 cursor-pointer'
                  onClick={() => {
                    setError('');
                  }}
                >
                  <CrossIcon />
                </div>
              </div>
            )}
            <div
              className={`mt-4 w-full m-auto  ${
                hideSideMenu
                  ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
                  : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
              }`}
            >
              {useStore.getState().generating || (
                <div className='md:w-[calc(100%-50px)] flex gap-4 flex-wrap justify-center'>
                  <ShareGPT />
                  <CloneChat />
                </div>
              )}
            </div>
            <div className='w-full h-32'></div>
          </div>
        </ScrollToBottom>
      </div>

      {/* 入力エリア（下部固定・オーバーレイ） */}
      <div className='absolute bottom-0 left-0 right-0 bg-transparent'>
        <div className='max-w-4xl mx-auto px-4 py-2 bg-transparent'>
          <Message
            role={inputRole}
            content={[{ type: 'text', text: '' } as TextContentInterface]}
            messageIndex={stickyIndex}
            sticky
          />
        </div>
      </div>
    </div>
  );
};

export default ChatContent;

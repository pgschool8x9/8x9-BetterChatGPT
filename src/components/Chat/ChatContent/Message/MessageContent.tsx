import React, { useState } from 'react';
import useStore from '@store/store';

import ContentView from './View/ContentView';
import EditView from './View/EditView';
import CopyButton from './View/Button/CopyButton';
import EditButton from './View/Button/EditButton';
import RefreshButton from './View/Button/RefreshButton';
import DeleteButton from './View/Button/DeleteButton';
import { ContentInterface, isTextContent, ChatInterface } from '@type/chat';
import useSubmit from '@hooks/useSubmit';
import PopupModal from '@components/PopupModal';

const MessageContent = ({
  role,
  content,
  messageIndex,
  sticky = false,
}: {
  role: string;
  content: ContentInterface[];
  messageIndex: number;
  sticky?: boolean;
}) => {
  const [isEdit, setIsEdit] = useState<boolean>(sticky);
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const advancedMode = useStore((state) => state.advancedMode);
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const setChats = useStore((state) => state.setChats);
  const lastMessageIndex = useStore((state) =>
    state.chats ? state.chats[state.currentChatIndex].messages.length - 1 : 0
  );

  const { handleSubmit } = useSubmit();

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

  const handleDelete = () => {
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    updatedChats[currentChatIndex].messages.splice(messageIndex, 1);
    setChats(updatedChats);
    setIsDelete(false);
  };

  const isUser = role === 'user';

  return (
    <div className='relative flex flex-col w-full'>
      {isEdit ? (
        <EditView
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
          sticky={sticky}
        />
      ) : (
        <>
          <ContentView
            role={role}
            content={content}
            setIsEdit={setIsEdit}
            messageIndex={messageIndex}
          />
          {/* ボタンをContentViewの外側に配置（stickyでない場合のみ） */}
          {!sticky && (
            <div className="w-full">
              <div
                className={`flex gap-3 ${
                  hideSideMenu
                    ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
                    : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
                } mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`${
                    isUser ? 'max-w-[70%] ml-auto' : 'max-w-[90%]'
                  }`}
                >
                  <div className="flex gap-1 mt-1 justify-end">
                    <DeleteButton setIsDelete={setIsDelete} />
                    <EditButton setIsEdit={setIsEdit} />
                    <CopyButton onClick={handleCopy} />
                    {!useStore.getState().generating &&
                      role === 'assistant' &&
                      messageIndex === lastMessageIndex && (
                        <RefreshButton onClick={handleRefresh} />
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* 削除確認ダイアログ */}
      {isDelete && (
        <PopupModal
          setIsModalOpen={setIsDelete}
          title="メッセージを削除"
          message="このメッセージを削除しますか？この操作は元に戻せません。"
          handleConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default MessageContent;

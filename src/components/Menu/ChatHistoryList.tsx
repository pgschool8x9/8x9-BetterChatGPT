import React, { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';
import { shallow } from 'zustand/shallow';

import ChatFolder from './ChatFolder';
import ChatHistory from './ChatHistory';
import ChatSearch from './ChatSearch';
import DeleteIcon from '@icon/DeleteIcon';
import CrossIcon from '@icon/CrossIcon';
import useInitialiseNewChat from '@hooks/useInitialiseNewChat';

import {
  ChatHistoryInterface,
  ChatHistoryFolderInterface,
  ChatInterface,
  FolderCollection,
  isImageContent,
  isTextContent,
  TotalTokenUsed,
  MessageInterface,
} from '@type/chat';
import { updateTotalTokenUsed } from '@utils/messageUtils';
import countTokens from '@utils/messageUtils';
import { ModelOptions } from '@utils/modelReader';

const ChatHistoryList = () => {
  const initialiseNewChat = useInitialiseNewChat();
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const displayChatSize = useStore((state) => state.displayChatSize);
  const setChats = useStore((state) => state.setChats);
  const setFolders = useStore((state) => state.setFolders);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const chatTitles = useStore(
    (state) => state.chats?.map((chat) => chat.title),
    shallow
  );

  const [isHover, setIsHover] = useState<boolean>(false);
  const [chatFolders, setChatFolders] = useState<ChatHistoryFolderInterface>(
    {}
  );
  const [noChatFolders, setNoChatFolders] = useState<ChatHistoryInterface[]>(
    []
  );
  const [filter, setFilter] = useState<string>('');
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  const chatsRef = useRef<ChatInterface[]>(useStore.getState().chats || []);
  const foldersRef = useRef<FolderCollection>(useStore.getState().folders);
  const filterRef = useRef<string>(filter);

  const updateFolders = useRef(() => {
    const _folders: ChatHistoryFolderInterface = {};
    const _noFolders: ChatHistoryInterface[] = [];
    const chats = useStore.getState().chats;
    const folders = useStore.getState().folders;
    const displayChatSize = useStore.getState().displayChatSize;

    Object.values(folders)
      .sort((a, b) => a.order - b.order)
      .forEach((f) => (_folders[f.id] = []));

    if (chats) {
      chats.forEach((chat, index) => {
        const _filterLowerCase = filterRef.current.toLowerCase();
        const _chatTitle = chat.title.toLowerCase();
        const _chatFolderName = chat.folder
          ? folders[chat.folder].name.toLowerCase()
          : '';

        if (
          !_chatTitle.includes(_filterLowerCase) &&
          !_chatFolderName.includes(_filterLowerCase) &&
          index !== useStore.getState().currentChatIndex
        )
          return;

        if (!chat.folder) {
          _noFolders.push({
            title: chat.title,
            index: index,
            id: chat.id,
            chatSize: !displayChatSize
              ? undefined
              : chat.messages.reduce(
                  (prev, current) =>
                    prev +
                    current.content.reduce(
                      (prevInner, currCont) =>
                        prevInner +
                        (isTextContent(currCont)
                          ? currCont.text.length
                          : isImageContent(currCont)
                          ? currCont.image_url.url.length
                          : 0),
                      0
                    ),
                  0
                ),
          });
        } else {
          if (!_folders[chat.folder]) _folders[_chatFolderName] = [];
          _folders[chat.folder].push({
            title: chat.title,
            index: index,
            id: chat.id,
            chatSize: !displayChatSize
              ? undefined
              : chat.messages.reduce(
                  (prev, current) =>
                    prev +
                    current.content.reduce(
                      (prevInner, currCont) =>
                        prevInner +
                        (isTextContent(currCont)
                          ? currCont.text.length
                          : isImageContent(currCont)
                          ? currCont.image_url.url.length
                          : 0),
                      0
                    ),
                  0
                ),
          });
        }
      });
    }

    setChatFolders(_folders);
    setNoChatFolders(_noFolders);
  }).current;

  useEffect(() => {
    updateFolders();

    const unsubscribe = useStore.subscribe((state) => {
      if (
        !state.generating &&
        state.chats &&
        state.chats !== chatsRef.current
      ) {
        updateFolders();
        chatsRef.current = state.chats;
      } else if (state.folders !== foldersRef.current) {
        updateFolders();
        foldersRef.current = state.folders;
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    updateFolders();
  }, [displayChatSize]);

  useEffect(() => {
    if (
      chatTitles &&
      currentChatIndex >= 0 &&
      currentChatIndex < chatTitles.length
    ) {
      // set title
      document.title = chatTitles[currentChatIndex];

      // expand folder of current chat
      const chats = useStore.getState().chats;
      if (chats) {
        const folderId = chats[currentChatIndex].folder;

        if (folderId) {
          const updatedFolders: FolderCollection = JSON.parse(
            JSON.stringify(useStore.getState().folders)
          );

          updatedFolders[folderId].expanded = true;
          setFolders(updatedFolders);
        }
      }
    }
  }, [currentChatIndex, chatTitles]);

  useEffect(() => {
    filterRef.current = filter;
    updateFolders();
  }, [filter]);

  // メニューが開かれた時にトークン・コスト計算を実行（一瞬で完了）
  useEffect(() => {
    if (!hideSideMenu) {
      const chats = useStore.getState().chats;
      if (chats && chats.length > 0) {
        // 各チャットのトークン使用情報が不足している場合は再計算
        const updatedChats = JSON.parse(JSON.stringify(chats));
        let hasUpdates = false;
        
        for (let i = 0; i < updatedChats.length; i++) {
          const chat = updatedChats[i];
          const model = chat.config.model as ModelOptions;
          
          // tokenUsedが存在しない、または空の場合は推定計算
          if (!chat.tokenUsed || !chat.tokenUsed[model] || 
              (chat.tokenUsed[model].promptTokens === 0 && 
               chat.tokenUsed[model].completionTokens === 0)) {
            
            // ChatHistory.tsxの既存ロジックと同様の推定計算
            const messages = chat.messages;
            const textPrompts = messages.filter(
              (e: MessageInterface) => Array.isArray(e.content) && e.content.some(isTextContent)
            );
            const imgPrompts = messages.filter(
              (e: MessageInterface) => Array.isArray(e.content) && e.content.some(isImageContent)
            );
            
            // 同期的にcountTokensを実行
            const tokenCount = countTokens(textPrompts, model);
            const imageTokenCount = countTokens(imgPrompts, model);
            
            // tokenUsedを初期化または更新
            if (!chat.tokenUsed) {
              chat.tokenUsed = {};
            }
            
            chat.tokenUsed[model] = {
              promptTokens: tokenCount,
              completionTokens: 0, // 推定では不明
              imageTokens: imageTokenCount,
            };
            
            hasUpdates = true;
          }
        }
        
        if (hasUpdates) {
          useStore.getState().setChats(updatedChats);
        }
      }
    }
  }, [hideSideMenu]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer) {
      e.stopPropagation();
      setIsHover(false);

      const chatIndices = JSON.parse(e.dataTransfer.getData('chatIndices'));
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      chatIndices.forEach((chatIndex: number) => {
        delete updatedChats[chatIndex].folder;
      });
      setChats(updatedChats);
      setSelectedChats([]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHover(true);
  };

  const handleDragLeave = () => {
    setIsHover(false);
  };

  const handleDragEnd = () => {
    setIsHover(false);
  };

  const handleLongPress = (chatIndex: number) => {
    setIsSelectionMode(true);
    setSelectedChats([chatIndex]);
    setLastSelectedIndex(chatIndex);
  };

  const resetSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedChats([]);
    setLastSelectedIndex(null);
  };

  // モバイル表示でチャットリストをタップした時にメニューを閉じる
  const handleMobileClick = () => {
    if (window.innerWidth < 768) {
      setHideSideMenu(true);
    }
  };

  const deleteSelectedChats = () => {
    const updatedChats = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    selectedChats
      .sort((a, b) => b - a)
      .forEach((index) => {
        updatedChats.splice(index, 1);
      });
    
    if (updatedChats.length > 0) {
      setCurrentChatIndex(0);
      setChats(updatedChats);
    } else {
      initialiseNewChat();
    }
    
    resetSelectionMode();
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        resetSelectionMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelectionMode]);

  return (
    <div
      className={`flex-col flex-1 overflow-y-auto hide-scroll-bar border-b border-white/20 ${
        isHover ? 'bg-gray-800/40' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onClick={handleMobileClick}
    >
      <ChatSearch filter={filter} setFilter={setFilter} />
      {isSelectionMode && (
        <div className='flex items-center px-3 py-2 bg-indigo-500/20 text-black dark:text-white text-sm rounded-md mb-2'>
          <span className='flex-1'>{selectedChats.length}件選択中</span>
          <div className='flex items-center gap-2 ml-auto'>
            <button
              onClick={deleteSelectedChats}
              className='text-blak dark:text-white hover:text-red-300'
              disabled={selectedChats.length === 0}
              aria-label='選択したチャットを削除'
            >
              <DeleteIcon />
            </button>
            <button
              onClick={resetSelectionMode}
              className='text-blak dark:text-white hover:text-gray-500 dark:hover:text-gray-200 p-1'
              aria-label='選択モードを終了'
            >
              <CrossIcon />
            </button>
          </div>
        </div>
      )}
      <div className='flex flex-col gap-2 text-gray-100 text-sm'>
        {Object.keys(chatFolders).map((folderId) => (
          <ChatFolder
            folderChats={chatFolders[folderId]}
            folderId={folderId}
            key={folderId}
            selectedChats={selectedChats}
            setSelectedChats={setSelectedChats}
            lastSelectedIndex={lastSelectedIndex}
            setLastSelectedIndex={setLastSelectedIndex}
            isSelectionMode={isSelectionMode}
            onLongPress={handleLongPress}
          />
        ))}
        {noChatFolders.map(({ title, index, id, chatSize }) => (
          <ChatHistory
            title={title}
            chatSize={chatSize}
            key={`${title}-${id}`}
            chatIndex={index}
            selectedChats={selectedChats}
            setSelectedChats={setSelectedChats}
            lastSelectedIndex={lastSelectedIndex}
            setLastSelectedIndex={setLastSelectedIndex}
            isSelectionMode={isSelectionMode}
            onLongPress={handleLongPress}
          />
        ))}
      </div>
      <div className='w-full h-10' />
    </div>
  );
};

const ShowMoreButton = () => {
  return (
    <button className='btn relative btn-dark btn-small m-auto mb-2'>
      <div className='flex items-center justify-center gap-2'>Show more</div>
    </button>
  );
};

export default ChatHistoryList;

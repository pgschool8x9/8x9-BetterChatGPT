import React, { useState, useRef, useEffect } from 'react';
import RefreshIcon from '@icon/RefreshIcon';
import SendIcon from '@icon/SendIcon';
import { PromptLibraryMenuPopUp } from '@components/PromptLibraryMenu/PromptLibraryMenu';
import useStore from '@store/store';

const ChatInput = () => {
  return (
    <div className='w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient'>
      <form className='stretch mx-2 flex flex-row gap-3 pt-2 last:mb-2 md:last:mb-6 lg:mx-auto lg:max-w-3xl lg:pt-6'>
        <div className='relative flex h-full flex-1 md:flex-col'>
          <TextField />
        </div>
      </form>
    </div>
  );
};

const TextField = () => {
  const [value, setValue] = useState<string>('');
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentChatIndex = useStore((state) => state.currentChatIndex);

  // チャット切り替え時に入力エリアをクリア
  useEffect(() => {
    setValue('');
  }, [currentChatIndex]);

  // 入力変更の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // スラッシュコマンドの検出
    if (newValue === '/') {
      setShowPromptModal(true);
      setValue(''); // スラッシュを削除
      return;
    }
    
    setValue(newValue);
  };

  // プロンプト選択後のコールバック
  const handlePromptSelect = (selectedPrompt: string) => {
    setValue(selectedPrompt);
    setShowPromptModal(false);
    textareaRef.current?.focus();
  };

  return (
    <>
      <div className='flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]'>
        <textarea
          ref={textareaRef}
          tabIndex={0}
          data-id='2557e994-6f98-4656-a955-7808084f8b8c'
          rows={1}
          value={value}
          onChange={handleInputChange}
          placeholder='メッセージを入力... (/ でプロンプトを選択)'
          className='m-0 w-full resize-none border-0 bg-transparent p-0 pl-2 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:pl-0'
          style={{ maxHeight: '200px', height: '24px', overflowY: 'hidden' }}
        />
        
        <button
          className='absolute p-1 rounded-md text-gray-500 bottom-1.5 right-1 md:bottom-2.5 md:right-2 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
          aria-label='submit'
        >
          <SendIcon />
        </button>
      </div>
      
      {/* プロンプトライブラリモーダル */}
      {showPromptModal && (
        <PromptLibraryMenuPopUp 
          setIsModalOpen={setShowPromptModal}
          onPromptSelect={handlePromptSelect}
        />
      )}
    </>
  );
};

export default ChatInput;

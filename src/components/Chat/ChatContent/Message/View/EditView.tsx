import React, { memo, useEffect, useState, useRef, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import useSubmit from '@hooks/useSubmit';

import {
  ChatInterface,
  ContentInterface,
  ImageContentInterface,
  TextContentInterface,
} from '@type/chat';

import CommandPrompt from '../CommandPrompt';
import { defaultModel } from '@constants/chat';
import ImageIcon from '@icon/ImageIcon';
import SendIcon from '@icon/SendIcon';
import { ModelOptions } from '@utils/modelReader';
import { modelTypes, modelStreamSupport } from '@constants/modelLoader';
import { toast } from 'react-toastify';
import { indexedDBManager } from '@utils/indexedDBManager';
import ImagePreviewList from './ImagePreviewList';

const EditView = ({
  content: content,
  setIsEdit,
  messageIndex,
  sticky,
}: {
  content: ContentInterface[];
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
  const inputRole = useStore((state) => state.inputRole);
  const setChats = useStore((state) => state.setChats);
  var currentChatIndex = useStore((state) => state.currentChatIndex);
  const model = useStore((state) => {
    const isInitialised =
      state.chats &&
      state.chats.length > 0 &&
      state.currentChatIndex >= 0 &&
      state.currentChatIndex < state.chats.length;
    if (!isInitialised) {
      currentChatIndex = 0;
      setCurrentChatIndex(0);
    }
    return isInitialised
      ? state.chats![state.currentChatIndex].config.model
      : defaultModel;
  });

  const [_content, _setContent] = useState<ContentInterface[]>(content);
  // imageUrl関連は不要（IndexedDB化により削除）
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [textRows, setTextRows] = useState(1);
  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const generating = useStore((state) => state.generating);
  const setGenerating = useStore((state) => state.setGenerating);
  
  // modelTypesの初期化状態を監視
  const [isModelTypesReady, setIsModelTypesReady] = useState(false);
  

  const { t } = useTranslation();

  const resetTextAreaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
        navigator.userAgent
      );

    if (e.key === 'Enter' && !isMobile && !e.nativeEvent.isComposing) {
      const enterToSubmit = useStore.getState().enterToSubmit;

      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        handleGenerate();
        resetTextAreaHeight();
      } else if (
        (enterToSubmit && !e.shiftKey) ||
        (!enterToSubmit && (e.ctrlKey || e.shiftKey))
      ) {
        if (sticky) {
          e.preventDefault();
          handleGenerate();
          resetTextAreaHeight();
        } else {
          handleSave();
        }
      }
    }
  };

  // convert message blob urls to base64
  const blobToBase64 = async (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const chat = updatedChats[currentChatIndex];
    const files = Array.from(e.target.files!);
    
    // 画像ファイルのみをフィルタリング
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
    
    // 非画像ファイルの警告
    if (nonImageFiles.length > 0) {
      const fileNames = nonImageFiles.map(f => f.name).join(', ');
      toast.error(`画像ファイルのみサポートしています。スキップしたファイル: ${fileNames}`);
    }
    
    if (imageFiles.length === 0) {
      return;
    }
    
    try {
      const newImages = await Promise.all(
        imageFiles.map(async (file: File) => {
          // IndexedDBにファイルを保存
          const fileId = await indexedDBManager.saveFile(file, {
            name: file.name,
            type: file.type,
          });
          
          return {
            type: 'image_url',
            image_url: {
              detail: 'auto',
              url: `indexeddb:${fileId}`,
            },
          } as ImageContentInterface;
        })
      );
      
      const updatedContent = [..._content, ...newImages];
      _setContent(updatedContent);
      
      if (imageFiles.length > 0) {
        toast.success(`${imageFiles.length}個の画像を追加しました`);
      }
    } catch (error) {
      console.error('ファイル保存中にエラーが発生しました:', error);
      toast.error('ファイルの保存に失敗しました');
    }
  };

  // handleImageUrlChangeは不要（IndexedDB化により削除）

  // handleImageDetailChangeは不要に（常にautoで固定）

  const handleRemoveImage = (index: number) => {
    // indexが-1の場合はエラー
    if (index === -1) {
      console.error('Invalid index: -1, cannot remove image');
      return;
    }
    
    const updatedImages = [..._content];
    updatedImages.splice(index, 1);
    _setContent(updatedImages);
    
    toast.success('画像を削除しました');
  };
  const handleSave = () => {
    const hasTextContent = (_content[0] as TextContentInterface).text !== '';
    const hasImageContent = Array.isArray(_content) && _content.some(
      (content) => content.type === 'image_url'
    );

    if (
      sticky &&
      ((!hasTextContent && !hasImageContent) || useStore.getState().generating)
    ) {
      return;
    }
    const originalChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedMessages = updatedChats[currentChatIndex].messages;

    if (sticky) {
      updatedMessages.push({ role: inputRole, content: _content });
      _setContent([
        {
          type: 'text',
          text: '',
        } as TextContentInterface,
      ]);
      resetTextAreaHeight();
    } else {
      updatedMessages[messageIndex].content = _content;
      setIsEdit(false);
    }
    try {
      setChats(updatedChats);
    } catch (error: unknown) {
      if ((error as DOMException).name === 'QuotaExceededError') {
        setChats(originalChats);
        toast.error(
          t('notifications.quotaExceeded', {
            ns: 'import',
          }),
          { autoClose: 15000 }
        );
        // try to save text only
        const textOnlyContent = _content.filter(isTextContent);
        if (textOnlyContent.length > 0) {
          updatedMessages[messageIndex].content = textOnlyContent;
          try {
            setChats(updatedChats);
            toast.info(
              t('notifications.textSavedOnly', {
                ns: 'import',
              }),
              { autoClose: 15000 }
            );
          } catch (innerError: unknown) {
            toast.error((innerError as Error).message);
          }
        }
      } else {
        toast.error((error as Error).message);
      }
    }
  };

  const { handleSubmit } = useSubmit();

  const handleStopGenerating = () => {
    if (modelStreamSupport[model]) {
      setGenerating(false);
      // キャンセル時に空のアシスタントメッセージのみ削除（ユーザーメッセージは残す）
      cleanupEmptyAssistantMessageOnly();
    } else {
      const confirmMessage = t('stopNonStreamGenerationWarning');
      if (window.confirm(confirmMessage)) {
        setGenerating(false);
        // キャンセル時に空のアシスタントメッセージのみ削除（ユーザーメッセージは残す）
        cleanupEmptyAssistantMessageOnly();
      }
    }
  };
  
  const cleanupEmptyAssistantMessageOnly = () => {
    const chats = useStore.getState().chats;
    if (chats && chats[currentChatIndex]) {
      const messages = chats[currentChatIndex].messages;
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      let hasChanges = false;
      
      // 最後のメッセージが空のアシスタントメッセージの場合のみ削除
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        const textContent = lastMessage.content[0] as TextContentInterface;
        const isEmpty = !textContent || 
                       !textContent.text || 
                       textContent.text.trim() === '';
        if (isEmpty) {
          updatedChats[currentChatIndex].messages.pop();
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        setChats(updatedChats);
      }
    }
  };
  
  const cleanupEmptyAssistantMessage = () => {
    const chats = useStore.getState().chats;
    if (chats && chats[currentChatIndex]) {
      const messages = chats[currentChatIndex].messages;
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      let hasChanges = false;
      
      // 最後のメッセージが空のアシスタントメッセージの場合削除
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        const textContent = lastMessage.content[0] as TextContentInterface;
        const isEmpty = !textContent || 
                       !textContent.text || 
                       textContent.text.trim() === '';
        if (isEmpty) {
          updatedChats[currentChatIndex].messages.pop();
          hasChanges = true;
        }
      }
      
      // その前のユーザーメッセージも削除（キャンセル時の場合）
      const secondLastMessage = updatedChats[currentChatIndex].messages[updatedChats[currentChatIndex].messages.length - 1];
      if (secondLastMessage && secondLastMessage.role === 'user') {
        updatedChats[currentChatIndex].messages.pop();
        hasChanges = true;
      }
      
      if (hasChanges) {
        setChats(updatedChats);
      }
    }
  };

  const handleGenerate = () => {
    const hasTextContent = (_content[0] as TextContentInterface).text !== '';
    const hasImageContent = Array.isArray(_content) && _content.some(
      (content) => content.type === 'image_url'
    );

    if (useStore.getState().generating) {
      return;
    }

    const originalChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const updatedMessages = updatedChats[currentChatIndex].messages;

    if (sticky) {
      if (hasTextContent || hasImageContent) {
        updatedMessages.push({ role: inputRole, content: _content });
      }
      _setContent([
        {
          type: 'text',
          text: '',
        } as TextContentInterface,
      ]);
      resetTextAreaHeight();
    } else {
      updatedMessages[messageIndex].content = _content;
      updatedChats[currentChatIndex].messages = updatedMessages.slice(
        0,
        messageIndex + 1
      );
      setIsEdit(false);
    }
    try {
      setChats(updatedChats);
    } catch (error: unknown) {
      if ((error as DOMException).name === 'QuotaExceededError') {
        setChats(originalChats);
        toast.error(
          t('notifications.quotaExceeded', {
            ns: 'import',
          }),
          { autoClose: 15000 }
        );
        // try to save text only
        const textOnlyContent = _content.filter(isTextContent);
        if (textOnlyContent.length > 0) {
          updatedMessages[messageIndex].content = textOnlyContent;
          try {
            setChats(updatedChats);
            toast.info(
              t('notifications.textSavedOnly', {
                ns: 'import',
              }),
              { autoClose: 15000 }
            );
          } catch (innerError: unknown) {
            console.log(innerError);
          }
        }
      } else {
        console.log(error);
      }
    }
    handleSubmit();
  };

  const isTextContent = (
    content: ContentInterface
  ): content is TextContentInterface => {
    return content.type === 'text';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const chat = updatedChats[currentChatIndex];
    
    try {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            // IndexedDBにファイルを保存
            const fileId = await indexedDBManager.saveFile(blob, {
              name: `pasted-image-${Date.now()}`,
              type: blob.type,
            });
            
            const newImage: ImageContentInterface = {
              type: 'image_url',
              image_url: {
                detail: 'auto',
                url: `indexeddb:${fileId}`,
              },
            };
            const updatedContent = [..._content, newImage];
            _setContent(updatedContent);
          }
        }
      }
    } catch (error) {
      console.error('ペーストした画像の保存に失敗しました:', error);
      toast.error('ペーストした画像の保存に失敗しました');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      
      // 行数を計算
      const lineHeight = 28; // leading-7 = 28px
      const rows = Math.round(textareaRef.current.scrollHeight / lineHeight);
      setTextRows(Math.max(1, rows));
    }
  }, [(_content[0] as TextContentInterface).text]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      
      // モバイルデバイスでの初期化問題を修正
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(navigator.userAgent);
      if (isMobile) {
        // モバイルでは強制的に単一行表示を維持
        setTextRows(1);
      } else {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        const lineHeight = 28; // leading-7 = 28px
        const rows = Math.round(textareaRef.current.scrollHeight / lineHeight);
        setTextRows(Math.max(1, rows));
      }
    }
  }, []);

  // modelTypesの初期化を監視
  useEffect(() => {
    const checkModelTypes = () => {
      if (modelTypes && Object.keys(modelTypes).length > 0) {
        setIsModelTypesReady(true);
      } else {
        // 少し待ってから再チェック
        setTimeout(checkModelTypes, 100);
      }
    };
    checkModelTypes();
  }, []);


  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));

    // 非画像ファイルの警告
    if (nonImageFiles.length > 0) {
      const fileNames = nonImageFiles.map(f => f.name).join(', ');
      toast.error(`画像ファイルのみサポートしています。スキップしたファイル: ${fileNames}`);
    }

    if (imageFiles.length === 0) {
      return;
    }

    try {
      const newImages = await Promise.all(
        imageFiles.map(async (file: File) => {
          const fileId = await indexedDBManager.saveFile(file, {
            name: file.name,
            type: file.type,
          });
          
          return {
            type: 'image_url',
            image_url: {
              detail: 'auto',
              url: `indexeddb:${fileId}`,
            },
          } as ImageContentInterface;
        })
      );
      
      const updatedContent = [..._content, ...newImages];
      _setContent(updatedContent);
      toast.success(`${imageFiles.length}個の画像を追加しました`);
    } catch (error) {
      console.error('ドロップした画像の保存に失敗しました:', error);
      toast.error('ドロップした画像の保存に失敗しました');
    }
  };

  const fileInputRef = useRef(null);
  const handleUploadButtonClick = () => {
    // Trigger the file input when the custom button is clicked
    (fileInputRef.current! as HTMLInputElement).click();
  };
  return (
    <div className='relative'>
      <div
        className='w-full'
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className='relative'>
          {/* ドラッグオーバー時のオーバーレイ */}
          {isDragOver && (
            <div className='absolute inset-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-full z-10'>
              <div className='text-blue-600 dark:text-blue-400 font-medium'>
                画像ファイルをドロップしてください
              </div>
            </div>
          )}
          
          {/* メッセージ入力エリアと左右ボタン */}
          <div className='flex items-center gap-1'>
            {/* 左側：カスタムプロンプトボタンと画像アップロードボタン */}
            <div className='flex-shrink-0 flex items-center gap-2'>
              <CommandPrompt _setContent={_setContent} />
              {isModelTypesReady && modelTypes[model] === 'image' && (
                <button
                  className='w-11 h-11 p-0 flex items-center justify-center rounded-full bg-gray-300/40 dark:bg-gray-500/40 backdrop-blur-md hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]'
                  onClick={handleUploadButtonClick}
                  aria-label='画像をアップロード'
                >
                  <ImageIcon className='w-5 h-5 text-gray-700 dark:text-gray-300' />
                </button>
              )}
            </div>
            
            {/* 中央：メッセージ入力エリア */}
            <div className='flex-1'>
              <div className={`min-h-[2.5rem] flex items-center py-2 pl-4 md:pl-6 pr-2 bg-gray-300/40 dark:bg-gray-500/40 backdrop-blur-md dark:text-white ${textRows === 1 ? 'rounded-full' : 'rounded-[1.25rem]'} shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] ${isDragOver ? 'bg-blue-50/80 dark:bg-blue-900/40' : ''}`}>
                <textarea
                  ref={textareaRef}
                  className='m-0 resize-none bg-transparent overflow-y-hidden focus:ring-0 focus-visible:ring-0 leading-7 flex-1 placeholder:text-black/40
                  dark:placeholder:text-white/40'
                  onChange={(e) => {
                    _setContent((prev) => [
                      { type: 'text', text: e.target.value },
                      ...prev.slice(1),
                    ]);
                  }}
                  value={(_content[0] as TextContentInterface).text}
                  placeholder={t('submitPlaceholder') as string}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  rows={1}
                ></textarea>
                
                {/* 送信ボタン（入力エリア内の右端） */}
                {sticky && (
                  <button
                    className={`w-8 h-8 ml-2 p-0 flex items-center justify-center rounded-full transition-all duration-200 ${
                      (_content[0] as TextContentInterface).text.trim().length > 0 || generating
                        ? 'opacity-100 pointer-events-auto' 
                        : 'opacity-0 pointer-events-none'
                    } ${
                      generating 
                        ? 'bg-blue-500/60 hover:bg-blue-500/80 text-blue-600 dark:text-blue-400' 
                        : 'bg-black/80 dark:bg-white/80 hover:bg-gray-900/80 dark:hover:bg-white/80 text-white dark:text-black'
                    }`}
                    onClick={generating ? handleStopGenerating : handleGenerate}
                    aria-label={generating ? "停止" : "送信"}
                  >
                    {generating ? (
                      <svg
                        className='h-4 w-4'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        style={{
                          animation: 'rotation 1s linear infinite'
                        }}
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='3'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                        ></path>
                      </svg>
                    ) : (
                      <SendIcon className='w-4 h-4' />
                    )}
                  </button>
                )}
                {!sticky && (
                  <button
                    className={`w-8 h-8 ml-2 p-0 flex items-center justify-center rounded-full transition-all duration-200 bg-gray-900/60 dark:bg-white/60 hover:bg-gray-900/80 dark:hover:bg-white/80 text-white dark:text-black ${
                      (_content[0] as TextContentInterface).text.trim().length > 0 
                        ? 'opacity-100 pointer-events-auto' 
                        : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => {
                      !generating && handleGenerate();
                    }}
                    aria-label="送信"
                  >
                    <SendIcon className='w-4 h-4' />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* 画像プレビューエリア */}
          {isModelTypesReady && modelTypes[model] === 'image' && (
            <ImagePreviewList
              content={_content}
              onRemoveImage={handleRemoveImage}
              onImageClick={(url) => console.log('Image clicked:', url)}
              className="mt-2"
            />
          )}
        </div>
      </div>
      <EditViewButtons
        sticky={sticky}
        handleFileChange={handleFileChange}
        handleRemoveImage={handleRemoveImage}
        handleGenerate={handleGenerate}
        handleSave={handleSave}
        setIsEdit={setIsEdit}
        _setContent={_setContent}
        _content={_content}
        fileInputRef={fileInputRef}
        model={model}
        isModelTypesReady={isModelTypesReady}
      />
    </div>
  );
};

const EditViewButtons = memo(
  ({
    sticky = false,
    handleFileChange,
    handleRemoveImage,
    handleGenerate,
    handleSave,
    setIsEdit,
    _setContent,
    _content,
    fileInputRef,
    model,
    isModelTypesReady,
  }: {
    sticky?: boolean;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: (index: number) => void;
    handleGenerate: () => void;
    handleSave: () => void;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    _setContent: React.Dispatch<React.SetStateAction<ContentInterface[]>>;
    _content: ContentInterface[];
    fileInputRef: React.MutableRefObject<null>;
    model: ModelOptions;
    isModelTypesReady: boolean;
  }) => {
    const { t } = useTranslation();
    const generating = useStore.getState().generating;
    const advancedMode = useStore((state) => state.advancedMode);

    return (
      <div>
        {/* IndexedDB化によりImageURL機能は不要になったため削除 */}
        {isModelTypesReady && modelTypes[model] === 'image' && (
          <>
            {/* Hidden file input */}
            <input
              type='file'
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept='image/*'
              onChange={handleFileChange}
              multiple
            />
          </>
        )}

      </div>
    );
  }
);

export default EditView;

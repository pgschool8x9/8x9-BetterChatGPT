import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useStore from '@store/store';
import ConfigMenu, { ModelSelector, MaxTokenSlider, TemperatureSlider, TopPSlider, PresencePenaltySlider, FrequencyPenaltySlider, ImageDetailSelector } from '@components/ConfigMenu/ConfigMenu';
import PopupModal from '@components/PopupModal';
import SettingIcon from '@icon/SettingIcon';
import ExportIcon from '@icon/ExportIcon';
import ImageIcon from '@icon/ImageIcon';
import MarkdownIcon from '@icon/MarkdownIcon';
import JsonIcon from '@icon/JsonIcon';
import MenuIcon from '@icon/MenuIcon';
import PlusIcon from '@icon/PlusIcon';
import { ChatInterface, ConfigInterface, ImageDetail } from '@type/chat';
import { _defaultChatConfig } from '@constants/chat';
import {
  chatToMarkdown,
  downloadImg,
  downloadMarkdown,
  htmlToImg,
} from '@utils/chat';
import downloadFile from '@utils/downloadFile';
import { ModelOptions } from '@utils/modelReader';
import useAddChat from '@hooks/useAddChat';

const ChatTitle = React.memo(({ saveRef }: { saveRef?: React.RefObject<HTMLDivElement> }) => {
  const { t } = useTranslation('model');
  const customModels = useStore((state) => state.customModels);
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const generating = useStore((state) => state.generating);
  const addChat = useAddChat();
  const chat = useStore(
    (state) =>
      state.chats &&
      state.chats.length > 0 &&
      state.currentChatIndex >= 0 &&
      state.currentChatIndex < state.chats.length
        ? state.chats[state.currentChatIndex]
        : undefined,
    shallow
  );
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
  
  // Local state for config values
  const [_maxToken, _setMaxToken] = useState<number>(chat?.config?.max_tokens || 4096);
  const [_model, _setModel] = useState<ModelOptions>(chat?.config?.model || 'gpt-3.5-turbo');
  const [_temperature, _setTemperature] = useState<number>(chat?.config?.temperature || 1);
  const [_presencePenalty, _setPresencePenalty] = useState<number>(chat?.config?.presence_penalty || 0);
  const [_topP, _setTopP] = useState<number>(chat?.config?.top_p || 1);
  const [_frequencyPenalty, _setFrequencyPenalty] = useState<number>(chat?.config?.frequency_penalty || 0);
  const [_imageDetail, _setImageDetail] = useState<ImageDetail>(chat?.imageDetail || 'auto');

  const setConfig = (config: ConfigInterface) => {
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    updatedChats[currentChatIndex].config = config;
    setChats(updatedChats);
  };

  const setImageDetail = (imageDetail: ImageDetail) => {
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    updatedChats[currentChatIndex].imageDetail = imageDetail;
    setChats(updatedChats);
  };

  const getModelDisplayName = (modelId: string) => {
    const isCustom = customModels.some(m => m.id === modelId);
    if (isCustom) {
      const customModel = customModels.find(m => m.id === modelId);
      return `${customModel?.name} ${t('customModels.customLabel', { ns: 'model' })}`;
    }
    return modelId;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setIsConfigExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update local state when chat changes
  useEffect(() => {
    if (chat) {
      _setMaxToken(chat.config?.max_tokens || 4096);
      _setModel(chat.config?.model || 'gpt-3.5-turbo' as ModelOptions);
      _setTemperature(chat.config?.temperature || 1);
      _setPresencePenalty(chat.config?.presence_penalty || 0);
      _setTopP(chat.config?.top_p || 1);
      _setFrequencyPenalty(chat.config?.frequency_penalty || 0);
      _setImageDetail(chat.imageDetail || 'auto');
    }
  }, [chat]);

  // Apply config changes immediately
  const handleConfigChange = () => {
    if (chat) {
      setConfig({
        max_tokens: _maxToken,
        model: _model,
        temperature: _temperature,
        presence_penalty: _presencePenalty,
        top_p: _topP,
        frequency_penalty: _frequencyPenalty,
      });
      setImageDetail(_imageDetail);
    }
  };

  // Apply changes when any config value changes
  useEffect(() => {
    if (chat && isConfigExpanded) {
      handleConfigChange();
    }
  }, [_maxToken, _model, _temperature, _presencePenalty, _topP, _frequencyPenalty, _imageDetail, isConfigExpanded]);

  // for migrating from old ChatInterface to new ChatInterface (with config)
  useEffect(() => {
    const chats = useStore.getState().chats;
    if (chats && chats.length > 0 && currentChatIndex !== -1 && !chat?.config) {
      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));
      updatedChats[currentChatIndex].config = { ..._defaultChatConfig };
      setChats(updatedChats);
    }
  }, [currentChatIndex]);

  return chat ? (
    <>
      <div className='sticky top-0 z-10 flex items-center justify-between w-full border-b border-black/10 bg-gray-50 px-2 md:px-4 py-2 md:py-3 dark:border-gray-900/50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'>
        {/* ナビゲーションメニューボタン */}
        <button
          className='p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2 relative z-[1000]'
          onClick={() => setHideSideMenu(!hideSideMenu)}
          aria-label={hideSideMenu ? 'メニューを開く' : 'メニューを閉じる'}
        >
          <MenuIcon className='w-5 h-5' />
        </button>

        {/* タイトル部分 - チャット名またはモデル名 */}
        <div className='flex-1 min-w-0'>
          <div className='text-base md:text-xl font-medium text-gray-900 dark:text-gray-100 truncate'>
            {chat.title || `${getModelDisplayName(chat.config.model)}`}
          </div>
        </div>

        {/* 右端のボタン群 */}
        <div className='flex items-center gap-1 md:gap-2'>
          {/* 新しいチャットボタン（全レスポンシブサイズで表示） */}
          <button
            className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
              generating ? 'cursor-not-allowed opacity-40' : ''
            }`}
            onClick={() => {
              if (!generating) addChat();
            }}
            aria-label='新しいチャット'
          >
            <PlusIcon className='w-5 h-5' />
          </button>
          {/* ダウンロードボタン */}
          <div className='relative' ref={downloadRef}>
            <button
              className='p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              aria-label='ダウンロード'
            >
              <ExportIcon className='w-5 h-5 stroke-current' />
            </button>

            {/* ダウンロードドロップダウン */}
            {isDownloadOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50'>
                <div className='p-2'>
                  <button
                    className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md'
                    onClick={async () => {
                      setIsDownloadOpen(false);
                      if (saveRef && saveRef.current) {
                        const imgData = await htmlToImg(saveRef.current);
                        downloadImg(
                          imgData,
                          `${chat?.title?.trim() ?? 'download'}.png`
                        );
                      }
                    }}
                  >
                    <ImageIcon className='w-4 h-4' />
                    画像
                  </button>
                  <button
                    className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md'
                    onClick={async () => {
                      setIsDownloadOpen(false);
                      const chats = useStore.getState().chats;
                      if (chats && saveRef && saveRef.current) {
                        const markdown = chatToMarkdown(
                          chats[useStore.getState().currentChatIndex]
                        );
                        downloadMarkdown(
                          markdown,
                          `${chat?.title?.trim() ?? 'download'}.md`
                        );
                      }
                    }}
                  >
                    <MarkdownIcon className='w-4 h-4' />
                    Markdown
                  </button>
                  <button
                    className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md'
                    onClick={async () => {
                      setIsDownloadOpen(false);
                      const chats = useStore.getState().chats;
                      if (chats) {
                        const chat = chats[useStore.getState().currentChatIndex];
                        downloadFile([chat], chat.title);
                      }
                    }}
                  >
                    <JsonIcon className='w-4 h-4' />
                    JSON
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 設定トグル */}
          <div className='relative' ref={configRef}>
            <button
              className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                isConfigExpanded ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              aria-label='設定を開く'
            >
              <SettingIcon className='w-5 h-5 fill-current' />
            </button>

            {/* コンパクトな設定ポップアップ */}
            {isConfigExpanded && (
              <div className='absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 max-h-96 overflow-y-auto'>
                <div className='p-4 space-y-4'>
                  <ModelSelector
                    _model={_model}
                    _setModel={_setModel}
                    _label={t('model')}
                  />
                  <MaxTokenSlider
                    _maxToken={_maxToken}
                    _setMaxToken={_setMaxToken}
                    _model={_model}
                  />
                  <TemperatureSlider
                    _temperature={_temperature}
                    _setTemperature={_setTemperature}
                  />
                  <TopPSlider _topP={_topP} _setTopP={_setTopP} />
                  <PresencePenaltySlider
                    _presencePenalty={_presencePenalty}
                    _setPresencePenalty={_setPresencePenalty}
                  />
                  <FrequencyPenaltySlider
                    _frequencyPenalty={_frequencyPenalty}
                    _setFrequencyPenalty={_setFrequencyPenalty}
                  />
                  <ImageDetailSelector
                    _imageDetail={_imageDetail}
                    _setImageDetail={_setImageDetail}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <ConfigMenu
          setIsModalOpen={setIsModalOpen}
          config={chat.config}
          setConfig={setConfig}
          imageDetail={chat.imageDetail}
          setImageDetail={setImageDetail}
        />
      )}
    </>
  ) : (
    <></>
  );
});

export default ChatTitle;
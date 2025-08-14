import { v4 as uuidv4 } from 'uuid';
import {
  ChatInterface,
  ConfigInterface,
  ImageDetail,
  TextContentInterface,
} from '@type/chat';
import useStore from '@store/store';

const date = new Date();
const dateString =
  date.getFullYear() +
  '-' +
  ('0' + (date.getMonth() + 1)).slice(-2) +
  '-' +
  ('0' + date.getDate()).slice(-2);

// default system message obtained using the following method: https://twitter.com/DeminDimin/status/1619935545144279040
export const getDefaultSystemMessage = () => {
  const fallbackMessage = `Please follow the rules below when responding

# Requirements
- I am 13 years old, so please adjust your expressions and language accordingly
- Provide innovative explanations in simple bullet points
- Please speak in a friendly manner using emojis`;

  if (import.meta.env.VITE_DEFAULT_SYSTEM_MESSAGE) {
    return import.meta.env.VITE_DEFAULT_SYSTEM_MESSAGE;
  }

  // i18nが利用可能な場合は翻訳されたメッセージを使用
  try {
    return (window as any).i18n?.t?.('defaultSystemMessage') || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

export const _defaultSystemMessage = getDefaultSystemMessage();

export const defaultApiVersion = '2024-04-01-preview';
export const defaultModel = 'gpt-4o-mini';

export const defaultUserMaxToken = 128000;
export const reduceMessagesToTotalToken = 256000; // sufficient for almost all models; gemini has 1.5kk though

export const _defaultChatConfig: ConfigInterface = {
  model: defaultModel,
  max_tokens: defaultUserMaxToken,
  temperature: 1,
  presence_penalty: 0,
  top_p: 1,
  frequency_penalty: 0,
};

export const generateDefaultChat = (
  title?: string,
  folder?: string
): ChatInterface => ({
  id: uuidv4(),
  title: title ? title : 'New Chat',
  messages:
    useStore.getState().defaultSystemMessage.length > 0
      ? [
          {
            role: 'system',
            content: [
              {
                type: 'text',
                text: useStore.getState().defaultSystemMessage,
              } as TextContentInterface,
            ],
          },
        ]
      : [],
  config: { ...useStore.getState().defaultChatConfig },
  titleSet: false,
  folder,
  imageDetail: useStore.getState().defaultImageDetail,
});

export const codeLanguageSubset = [
  'python',
  'javascript',
  'java',
  'go',
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'diff',
  'graphql',
  'json',
  'kotlin',
  'less',
  'lua',
  'makefile',
  'markdown',
  'objectivec',
  'perl',
  'php',
  'php-template',
  'plaintext',
  'python-repl',
  'r',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'typescript',
  'vbnet',
  'wasm',
  'xml',
  'yaml',
];

export const _defaultMenuWidth = 260;
export const _defaultDisplayChatSize = false;
export const _defaultImageDetail: ImageDetail = 'auto';

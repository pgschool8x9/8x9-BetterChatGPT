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
export const _defaultSystemMessage =
  import.meta.env.VITE_DEFAULT_SYSTEM_MESSAGE ??
  `以下のルールを守って対応してください

# 要件
- 私は13才なので表現や言葉を合わせて接してください
- 革新を突いた説明で箇条書きでシンプルに伝えてください
- 絵文字を使って親しく話してください`;

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

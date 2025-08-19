import { ShareGPTSubmitBodyInterface } from '@type/api';
import {
  ConfigInterface,
  MessageInterface,
} from '@type/chat';
import { isAzureEndpoint } from '@utils/api';
import { ModelOptions } from '@utils/modelReader';

// GPT-5系モデルかどうかを判定する関数
const isGPT5Model = (model: ModelOptions): boolean => {
  return model.includes('gpt-5');
};

export const getChatCompletion = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>,
  apiVersionToUse?: string
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const modelmapping: Partial<Record<ModelOptions, string>> = {
      'gpt-3.5-turbo': 'gpt-35-turbo',
      'gpt-3.5-turbo-16k': 'gpt-35-turbo-16k',
      'gpt-3.5-turbo-1106': 'gpt-35-turbo-1106',
      'gpt-3.5-turbo-0125': 'gpt-35-turbo-0125',
    };

    const model = modelmapping[config.model] || config.model;

    // set api version to 2023-07-01-preview for gpt-4 and gpt-4-32k, otherwise use 2023-03-15-preview
    const apiVersion =
      apiVersionToUse ??
      (model === 'gpt-4' || model === 'gpt-4-32k'
        ? '2023-07-01-preview'
        : '2023-03-15-preview');

    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }
  endpoint = endpoint.trim();

  // GPT-5系パラメータを除外した基本config
  const { verbosity, reasoning_effort, ...baseConfig } = config;

  // リクエストボディを構築
  let requestBody: any = {
    messages,
    ...baseConfig,
    max_tokens: undefined,
  };

  // GPT-5系モデルの場合のみ、専用パラメータを追加
  if (isGPT5Model(config.model)) {
    requestBody = {
      ...requestBody,
      response_format: {
        type: "text"
      },
      verbosity: verbosity || "medium",
      reasoning_effort: reasoning_effort || "minimal"
    };
  }

  // OpenAI API送信ログ
  console.group('🚀 OpenAI API Request');
  console.log('📍 Endpoint:', endpoint);
  console.log('📋 Headers:', JSON.stringify(headers, null, 2));
  console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
  console.groupEnd();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.group('❌ OpenAI API Error Response');
    console.log('Status:', response.status);
    console.log('Error:', errorText);
    console.groupEnd();
    throw new Error(errorText);
  }

  const data = await response.json();
  console.group('✅ OpenAI API Response');
  console.log('Status:', response.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));
  console.groupEnd();
  return data;
};

export const getChatCompletionStream = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>,
  apiVersionToUse?: string
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const modelmapping: Partial<Record<ModelOptions, string>> = {
      'gpt-3.5-turbo': 'gpt-35-turbo',
      'gpt-3.5-turbo-16k': 'gpt-35-turbo-16k',
    };

    const model = modelmapping[config.model] || config.model;

    // set api version to 2023-07-01-preview for gpt-4 and gpt-4-32k, otherwise use 2023-03-15-preview
    const apiVersion =
      apiVersionToUse ??
      (model === 'gpt-4' || model === 'gpt-4-32k'
        ? '2023-07-01-preview'
        : '2023-03-15-preview');
    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }
  endpoint = endpoint.trim();

  // GPT-5系パラメータを除外した基本config
  const { verbosity, reasoning_effort, ...baseConfig } = config;

  // リクエストボディを構築
  let requestBody: any = {
    messages,
    ...baseConfig,
    max_tokens: undefined,
    stream: true,
  };

  // GPT-5系モデルの場合のみ、専用パラメータを追加
  if (isGPT5Model(config.model)) {
    requestBody = {
      ...requestBody,
      response_format: {
        type: "text"
      },
      verbosity: verbosity || "medium",
      reasoning_effort: reasoning_effort || "minimal"
    };
  }

  // OpenAI API送信ログ（ストリーミング）
  console.group('🌊 OpenAI API Request (Stream)');
  console.log('📍 Endpoint:', endpoint);
  console.log('📋 Headers:', JSON.stringify(headers, null, 2));
  console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
  console.groupEnd();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  if (response.status === 404 || response.status === 405) {
    const text = await response.text();

    if (text.includes('model_not_found')) {
      throw new Error(
        text +
          '\nMessage from Better ChatGPT:\nPlease ensure that you have access to the GPT-4 API!'
      );
    } else {
      throw new Error(
        'Message from Better ChatGPT:\nInvalid API endpoint! We recommend you to check your free API endpoint.'
      );
    }
  }

  if (response.status === 429 || !response.ok) {
    const text = await response.text();
    let error = text;
    if (text.includes('insufficient_quota')) {
      error +=
        '\nMessage from Better ChatGPT:\nWe recommend changing your API endpoint or API key';
    } else if (response.status === 429) {
      error += '\nRate limited!';
    }
    throw new Error(error);
  }

  const stream = response.body;
  console.group('✅ OpenAI API Stream Response');
  console.log('Status:', response.status);
  console.log('Stream started successfully');
  console.groupEnd();
  return stream;
};


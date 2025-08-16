import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PopupModal from '@components/PopupModal';
import { ConfigInterface, ImageDetail, Verbosity, ReasoningEffort, ReasoningSummary } from '@type/chat';
import Select from 'react-select';
import { modelOptions, modelMaxToken } from '@constants/modelLoader';
import { ModelOptions } from '@utils/modelReader';
import useStore from '@store/store';

// GPT-5系モデルかどうかを判定する関数
const isGPT5Model = (model: ModelOptions): boolean => {
  return model.includes('gpt-5');
};

// テーマに応じたカスタムスタイルを生成する関数
const getCustomStyles = () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: isDark ? '#2D3748' : '#ffffff',
      color: isDark ? '#E2E8F0' : '#1a1a1a',
      borderColor: isDark ? '#4A5568' : '#d1d5db',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: isDark ? '#2D3748' : '#ffffff',
      borderColor: isDark ? '#4A5568' : '#d1d5db',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      'backgroundColor': state.isSelected 
        ? (isDark ? '#4A5568' : '#e5e7eb') 
        : (isDark ? '#2D3748' : '#ffffff'),
      'color': isDark ? '#E2E8F0' : '#1a1a1a',
      '&:hover': {
        backgroundColor: isDark ? '#4A5568' : '#f3f4f6',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: isDark ? '#E2E8F0' : '#1a1a1a',
    }),
    input: (provided: any) => ({
      ...provided,
      color: isDark ? '#E2E8F0' : '#1a1a1a',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: isDark ? '#A0AEC0' : '#9ca3af',
    }),
  };
};

const ConfigMenu = ({
  setIsModalOpen,
  config,
  setConfig,
  imageDetail,
  setImageDetail,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  config: ConfigInterface;
  setConfig: (config: ConfigInterface) => void;
  imageDetail: ImageDetail;
  setImageDetail: (imageDetail: ImageDetail) => void;
}) => {
  const [_maxToken, _setMaxToken] = useState<number>(config.max_tokens);
  const [_model, _setModel] = useState<ModelOptions>(config.model);
  const [_temperature, _setTemperature] = useState<number>(config.temperature);
  const [_presencePenalty, _setPresencePenalty] = useState<number>(
    config.presence_penalty
  );
  const [_topP, _setTopP] = useState<number>(config.top_p);
  const [_frequencyPenalty, _setFrequencyPenalty] = useState<number>(
    config.frequency_penalty
  );
  const [_imageDetail, _setImageDetail] = useState<ImageDetail>(imageDetail);
  
  // GPT-5系専用パラメータの状態変数
  const [_verbosity, _setVerbosity] = useState<Verbosity>(
    config.verbosity || 'medium'
  );
  const [_reasoningEffort, _setReasoningEffort] = useState<ReasoningEffort>(
    config.reasoning_effort || 'minimal'
  );
  
  const { t } = useTranslation('model');

  const handleConfirm = () => {
    setConfig({
      max_tokens: _maxToken,
      model: _model,
      temperature: _temperature,
      presence_penalty: _presencePenalty,
      top_p: _topP,
      frequency_penalty: _frequencyPenalty,
      verbosity: _verbosity,
      reasoning_effort: _reasoningEffort,
    });
    setImageDetail(_imageDetail);
    setIsModalOpen(false);
  };

  return (
    <PopupModal
      title={t('configuration') as string}
      setIsModalOpen={setIsModalOpen}
      handleConfirm={handleConfirm}
      handleClickBackdrop={handleConfirm}
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-600'>
        <ModelSelector
          _model={_model}
          _setModel={_setModel}
          _label={t('Model')}
        />
        {isGPT5Model(_model) && (
          <>
            <VerbositySelector
              _verbosity={_verbosity}
              _setVerbosity={_setVerbosity}
            />
            <ReasoningEffortSelector
              _reasoningEffort={_reasoningEffort}
              _setReasoningEffort={_setReasoningEffort}
            />
          </>
        )}
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
    </PopupModal>
  );
};

export const ModelSelector = ({
  _model,
  _setModel,
  _label,
}: {
  _model: ModelOptions;
  _setModel: React.Dispatch<React.SetStateAction<ModelOptions>>;
  _label: string;
}) => {
  const { t } = useTranslation(['main', 'model']);
  const [localModelOptions, setLocalModelOptions] = useState<string[]>(modelOptions);
  const customModels = useStore((state) => state.customModels);

  // Update model options when custom models change
  useEffect(() => {
    const customModelIds = customModels.map(model => model.id);
    const defaultModelIds = modelOptions.filter(id => !customModelIds.includes(id));
    setLocalModelOptions([...customModelIds, ...defaultModelIds]);
  }, [customModels]);

  const modelOptionsFormatted = localModelOptions.map((model) => {
    const isCustom = customModels.some(m => m.id === model);
    const customModel = customModels.find(m => m.id === model);
    return {
      value: model,
      label: isCustom ? `${customModel?.name} ${t('customModels.customLabel', { ns: 'model' })}` : model,
    };
  });

  return (
    <div className='mb-4'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {_label}
      </label>
      <Select
        value={{
          value: _model,
          label: customModels.some(m => m.id === _model) 
            ? `${customModels.find(m => m.id === _model)?.name} ${t('customModels.customLabel', { ns: 'model' })}` 
            : _model,
        }}
        onChange={(selectedOption) =>
          _setModel(selectedOption?.value as ModelOptions)
        }
        options={modelOptionsFormatted}
        className='basic-single py-2'
        classNamePrefix='select'
        styles={getCustomStyles()}
      />
    </div>
  );
};

export const MaxTokenSlider = ({
  _maxToken,
  _setMaxToken,
  _model,
}: {
  _maxToken: number;
  _setMaxToken: React.Dispatch<React.SetStateAction<number>>;
  _model: ModelOptions;
}) => {
  const { t } = useTranslation('model');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef &&
      inputRef.current &&
      _setMaxToken(Number(inputRef.current.value));
  }, [_model]);

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('token.label')}: {_maxToken}
      </label>
      <input
        type='range'
        ref={inputRef}
        value={_maxToken}
        onChange={(e) => {
          _setMaxToken(Number(e.target.value));
        }}
        min={0}
        max={modelMaxToken[_model]}
        step={1}
        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
      />
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('token.description')}
      </div>
    </div>
  );
};

export const TemperatureSlider = ({
  _temperature,
  _setTemperature,
}: {
  _temperature: number;
  _setTemperature: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { t } = useTranslation('model');

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('temperature.label')}: {_temperature}
      </label>
      <input
        id='default-range'
        type='range'
        value={_temperature}
        onChange={(e) => {
          _setTemperature(Number(e.target.value));
        }}
        min={0}
        max={2}
        step={0.1}
        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
      />
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('temperature.description')}
      </div>
    </div>
  );
};

export const TopPSlider = ({
  _topP,
  _setTopP,
}: {
  _topP: number;
  _setTopP: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { t } = useTranslation('model');

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('topP.label')}: {_topP}
      </label>
      <input
        id='default-range'
        type='range'
        value={_topP}
        onChange={(e) => {
          _setTopP(Number(e.target.value));
        }}
        min={0}
        max={1}
        step={0.05}
        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
      />
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('topP.description')}
      </div>
    </div>
  );
};

export const PresencePenaltySlider = ({
  _presencePenalty,
  _setPresencePenalty,
}: {
  _presencePenalty: number;
  _setPresencePenalty: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { t } = useTranslation('model');

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('presencePenalty.label')}: {_presencePenalty}
      </label>
      <input
        id='default-range'
        type='range'
        value={_presencePenalty}
        onChange={(e) => {
          _setPresencePenalty(Number(e.target.value));
        }}
        min={-2}
        max={2}
        step={0.1}
        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
      />
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('presencePenalty.description')}
      </div>
    </div>
  );
};

export const FrequencyPenaltySlider = ({
  _frequencyPenalty,
  _setFrequencyPenalty,
}: {
  _frequencyPenalty: number;
  _setFrequencyPenalty: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { t } = useTranslation('model');

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('frequencyPenalty.label')}: {_frequencyPenalty}
      </label>
      <input
        id='default-range'
        type='range'
        value={_frequencyPenalty}
        onChange={(e) => {
          _setFrequencyPenalty(Number(e.target.value));
        }}
        min={-2}
        max={2}
        step={0.1}
        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
      />
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('frequencyPenalty.description')}
      </div>
    </div>
  );
};

export const ImageDetailSelector = ({
  _imageDetail,
  _setImageDetail,
}: {
  _imageDetail: ImageDetail;
  _setImageDetail: React.Dispatch<React.SetStateAction<ImageDetail>>;
}) => {
  const { t } = useTranslation('model');

  const imageDetailOptions = [
    { value: 'low', label: t('imageDetail.low') },
    { value: 'high', label: t('imageDetail.high') },
    { value: 'auto', label: t('imageDetail.auto') },
  ];

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('imageDetail.label')}
      </label>
      <Select
        value={imageDetailOptions.find(
          (option) => option.value === _imageDetail
        )}
        onChange={(selectedOption) =>
          _setImageDetail(selectedOption?.value as ImageDetail)
        }
        options={imageDetailOptions}
        className='basic-single py-2'
        classNamePrefix='select'
        styles={getCustomStyles()}
      />
    </div>
  );
};

// GPT-5系専用パラメータセレクター
export const VerbositySelector = ({
  _verbosity,
  _setVerbosity,
}: {
  _verbosity: Verbosity;
  _setVerbosity: React.Dispatch<React.SetStateAction<Verbosity>>;
}) => {
  const { t } = useTranslation('model');

  const verbosityOptions = [
    { value: 'low', label: t('verbosity.low') },
    { value: 'medium', label: t('verbosity.medium') },
    { value: 'high', label: t('verbosity.high') },
  ];

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('verbosity.label')} {t('gpt5Exclusive')}
      </label>
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('verbosity.description')}
      </div>
      <Select
        value={verbosityOptions.find(
          (option) => option.value === _verbosity
        )}
        onChange={(selectedOption) =>
          _setVerbosity(selectedOption?.value as Verbosity)
        }
        options={verbosityOptions}
        className='basic-single py-2'
        classNamePrefix='select'
        styles={getCustomStyles()}
      />
    </div>
  );
};

export const ReasoningEffortSelector = ({
  _reasoningEffort,
  _setReasoningEffort,
}: {
  _reasoningEffort: ReasoningEffort;
  _setReasoningEffort: React.Dispatch<React.SetStateAction<ReasoningEffort>>;
}) => {
  const { t } = useTranslation('model');

  const reasoningEffortOptions = [
    { value: 'minimal', label: t('reasoningEffort.minimal') },
    { value: 'low', label: t('reasoningEffort.low') },
    { value: 'medium', label: t('reasoningEffort.medium') },
    { value: 'high', label: t('reasoningEffort.high') },
  ];

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('reasoningEffort.label')} {t('gpt5Exclusive')}
      </label>
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('reasoningEffort.description')}
      </div>
      <Select
        value={reasoningEffortOptions.find(
          (option) => option.value === _reasoningEffort
        )}
        onChange={(selectedOption) =>
          _setReasoningEffort(selectedOption?.value as ReasoningEffort)
        }
        options={reasoningEffortOptions}
        className='basic-single py-2'
        classNamePrefix='select'
        styles={getCustomStyles()}
      />
    </div>
  );
};

export const ReasoningSummarySelector = ({
  _reasoningSummary,
  _setReasoningSummary,
}: {
  _reasoningSummary: ReasoningSummary;
  _setReasoningSummary: React.Dispatch<React.SetStateAction<ReasoningSummary>>;
}) => {
  const { t } = useTranslation('model');

  const reasoningSummaryOptions = [
    { value: 'none', label: t('reasoningSummary.none') },
    { value: 'detailed', label: t('reasoningSummary.detailed') },
    { value: 'auto', label: t('reasoningSummary.auto') },
  ];

  return (
    <div className='mt-5 pt-5 border-t border-gray-500'>
      <label className='block text-sm font-medium text-gray-900 dark:text-white'>
        {t('reasoningSummary.label')} {t('gpt5Exclusive')}
      </label>
      <div className='min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2'>
        {t('reasoningSummary.description')}
      </div>
      <Select
        value={reasoningSummaryOptions.find(
          (option) => option.value === _reasoningSummary
        )}
        onChange={(selectedOption) =>
          _setReasoningSummary(selectedOption?.value as ReasoningSummary)
        }
        options={reasoningSummaryOptions}
        className='basic-single py-2'
        classNamePrefix='select'
        styles={getCustomStyles()}
      />
    </div>
  );
};

export default ConfigMenu;

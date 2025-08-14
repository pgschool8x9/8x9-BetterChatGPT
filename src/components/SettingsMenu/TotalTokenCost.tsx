import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '@store/store';

import Toggle from '@components/Toggle/Toggle';

import CalculatorIcon from '@icon/CalculatorIcon';
import { modelCost } from '@constants/modelLoader';
import { TotalTokenUsed } from '@type/chat';
import { ModelOptions } from '@utils/modelReader';
import { useLocalizedCurrency } from '@utils/currency';

type CostMapping = { model: string; cost: number }[];

const tokenCostToCost = (
  tokenCost: TotalTokenUsed[ModelOptions],
  model: ModelOptions
) => {
  if (!tokenCost) return 0;

  const modelCostEntry = modelCost[model as keyof typeof modelCost];

  if (!modelCostEntry) {
    return 0; // Return 0 if the model does not exist in modelCost
  }

  const { prompt, completion, image } = modelCostEntry;
  const completionCost =
    (completion.price / completion.unit) * tokenCost.completionTokens;
    const promptCost = (prompt.price / prompt.unit) * tokenCost.promptTokens;
    const imageCost = (image.price / image.unit) * (tokenCost.imageTokens ? 1 : 0);
  return completionCost + promptCost + imageCost;
};

const TotalTokenCost = () => {
  const { t } = useTranslation(['main', 'model']);
  const { formatLocalizedCurrency, currentCurrency } = useLocalizedCurrency();

  const totalTokenUsed = useStore((state) => state.totalTokenUsed);
  const setTotalTokenUsed = useStore((state) => state.setTotalTokenUsed);
  const countTotalTokens = useStore((state) => state.countTotalTokens);

  const [costMapping, setCostMapping] = useState<CostMapping>([]);
  const [localizedCostMapping, setLocalizedCostMapping] = useState<{ model: string; cost: string }[]>([]);
  const [localizedTotal, setLocalizedTotal] = useState<string>('');

  const resetCost = () => {
    setTotalTokenUsed({});
  };

  useEffect(() => {
    const updatedCostMapping: CostMapping = [];
    Object.entries(totalTokenUsed).forEach(([model, tokenCost]) => {
      const cost = tokenCostToCost(tokenCost, model as ModelOptions);
      updatedCostMapping.push({ model, cost });
    });

    setCostMapping(updatedCostMapping);
  }, [totalTokenUsed]);

  // 通貨変換を非同期で実行
  useEffect(() => {
    const convertCosts = async () => {
      const convertedMapping = await Promise.all(
        costMapping.map(async ({ model, cost }) => ({
          model,
          cost: await formatLocalizedCurrency(cost)
        }))
      );
      setLocalizedCostMapping(convertedMapping);

      const totalCost = costMapping.reduce((prev, curr) => prev + curr.cost, 0);
      const convertedTotal = await formatLocalizedCurrency(totalCost);
      setLocalizedTotal(convertedTotal);
    };

    if (costMapping.length > 0) {
      convertCosts();
    }
  }, [costMapping, formatLocalizedCurrency]);

  return countTotalTokens ? (
    <div className='flex flex-col items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg'>
      <div className='text-sm font-semibold text-gray-900 dark:text-gray-300'>{t('costManagement')}</div>
      
      <div className='w-full'>
        <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
          <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
            <thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
              <tr>
                <th className='px-4 py-2'>{t('model', { ns: 'model' })}</th>
                <th className='px-4 py-2'>{currentCurrency}</th>
              </tr>
            </thead>
            <tbody>
              {localizedCostMapping.map(({ model, cost }) => (
                <tr
                  key={model}
                  className='bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  <td className='px-4 py-2'>{model}</td>
                  <td className='px-4 py-2'>{cost}</td>
                </tr>
              ))}
              <tr className='bg-white border-b dark:bg-gray-800 dark:border-gray-700 font-bold'>
                <td className='px-4 py-2'>{t('total', { ns: 'main' })}</td>
                <td className='px-4 py-2'>{localizedTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className='btn btn-neutral cursor-pointer' onClick={resetCost}>
        {t('resetCost', { ns: 'main' })}
      </div>
    </div>
  ) : (
    <></>
  );
};

export const TotalTokenCostToggle = () => {
  const { t } = useTranslation('main');

  const setCountTotalTokens = useStore((state) => state.setCountTotalTokens);

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().countTotalTokens
  );

  useEffect(() => {
    setCountTotalTokens(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={t('countTotalTokens') as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export const TotalTokenCostDisplay = () => {
  const { t } = useTranslation();
  const totalTokenUsed = useStore((state) => state.totalTokenUsed);
  const { formatLocalizedCurrency } = useLocalizedCurrency();

  const [totalCost, setTotalCost] = useState<number>(0);
  const [localizedCost, setLocalizedCost] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  
  // モバイル環境の検出
  const isMobile = typeof window !== 'undefined' && 
    ('ontouchstart' in window || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  // hydration完了を待つ
  useEffect(() => {
    const handleHydration = () => {
      setIsHydrated(true);
    };

    // すでにhydratedかチェック
    const currentData = useStore.getState().totalTokenUsed;
    if (currentData && Object.keys(currentData).length > 0) {
      setIsHydrated(true);
    } else {
      // hydration完了イベントを待つ
      window.addEventListener('zustand-hydrated', handleHydration);
    }

    return () => {
      window.removeEventListener('zustand-hydrated', handleHydration);
    };
  }, []);


  useEffect(() => {
    let updatedTotalCost = 0;
    Object.entries(totalTokenUsed || {}).forEach(([model, tokenCost]) => {
      const cost = tokenCostToCost(tokenCost, model as ModelOptions);
      // 負のコストは除外（モデルが見つからない場合など）
      if (cost >= 0) {
        updatedTotalCost += cost;
      }
    });

    setTotalCost(updatedTotalCost);
  }, [totalTokenUsed]);

  // 通貨変換を非同期で実行
  useEffect(() => {
    if (totalCost !== undefined) {
      formatLocalizedCurrency(totalCost).then(setLocalizedCost).catch(() => {
        setLocalizedCost(`$${totalCost.toFixed(3)}`);
      });
    }
  }, [totalCost, formatLocalizedCurrency]);

  return (
    <a className='flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white text-sm'>
      <CalculatorIcon />
      {!isHydrated ? 'Loading...' : (localizedCost || (totalCost === 0 ? '$0.000' : 'Loading...'))}
    </a>
  );
};

export default TotalTokenCost;

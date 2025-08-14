import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const AutoTitleToggle = () => {
  const { t } = useTranslation(['main', 'model']);

  const setAutoTitle = useStore((state) => state.setAutoTitle);
  const setTitleModel = useStore((state) => state.setTitleModel);

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().autoTitle
  );

  useEffect(() => {
    setAutoTitle(isChecked);
  }, [isChecked]);

  useEffect(() => {
    // タイトル生成モデルを固定で gpt-4o-mini に設定
    setTitleModel('gpt-4o-mini');
  }, []);

  return (
    <Toggle
      label={t('autoTitle') as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default AutoTitleToggle;

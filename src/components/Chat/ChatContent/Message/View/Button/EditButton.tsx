import React, { memo } from 'react';

import EditIcon2 from '@icon/EditIcon2';
import CrossIcon from '@icon/CrossIcon';

import BaseButton from './BaseButton';

const EditButton = memo(
  ({
    setIsEdit,
    isEdit,
  }: {
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    isEdit?: boolean;
  }) => {
    return (
      <BaseButton
        icon={isEdit ? <CrossIcon /> : <EditIcon2 />}
        buttonProps={{ 
          'aria-label': isEdit ? 'cancel edit' : 'edit message' 
        }}
        onClick={() => setIsEdit(!isEdit)}
      />
    );
  }
);

export default EditButton;

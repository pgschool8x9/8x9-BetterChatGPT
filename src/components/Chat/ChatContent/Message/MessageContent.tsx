import React, { useState } from 'react';

import ContentView from './View/ContentView';
import EditView from './View/EditView';
import { ContentInterface } from '@type/chat';

const MessageContent = ({
  role,
  content,
  messageIndex,
  sticky = false,
  isEdit,
  setIsEdit,
  onTypingChange,
}: {
  role: string;
  content: ContentInterface[];
  messageIndex: number;
  sticky?: boolean;
  isEdit?: boolean;
  setIsEdit?: React.Dispatch<React.SetStateAction<boolean>>;
  onTypingChange?: (isTyping: boolean) => void;
}) => {
  const localIsEdit = isEdit !== undefined ? isEdit : useState<boolean>(sticky)[0];
  const localSetIsEdit = setIsEdit !== undefined ? setIsEdit : useState<boolean>(sticky)[1];

  return (
    <div className='relative flex flex-col w-full'>
      {localIsEdit ? (
        <EditView
          content={content}
          setIsEdit={localSetIsEdit}
          messageIndex={messageIndex}
          sticky={sticky}
          onTypingChange={onTypingChange}
        />
      ) : (
        <ContentView
          role={role}
          content={content}
          setIsEdit={localSetIsEdit}
          messageIndex={messageIndex}
        />
      )}
    </div>
  );
};

export default MessageContent;

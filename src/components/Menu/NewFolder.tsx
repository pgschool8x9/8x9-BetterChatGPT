import React from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import useStore from '@store/store';

import NewFolderIcon from '@icon/NewFolderIcon';
import { Folder, FolderCollection } from '@type/chat';

const NewFolder = () => {
  const { t } = useTranslation();
  const generating = useStore((state) => state.generating);
  const setFolders = useStore((state) => state.setFolders);

  const addFolder = () => {
    let folderIndex = 1;
    let name = `New Folder ${folderIndex}`;

    const folders = useStore.getState().folders;

    while (Object.values(folders).some((folder) => folder.name === name)) {
      folderIndex += 1;
      name = `New Folder ${folderIndex}`;
    }

    const updatedFolders: FolderCollection = JSON.parse(
      JSON.stringify(folders)
    );

    const id = uuidv4();
    const newFolder: Folder = {
      id,
      name,
      expanded: false,
      order: 0,
    };

    Object.values(updatedFolders).forEach((folder) => {
      folder.order += 1;
    });

    setFolders({ [id]: newFolder, ...updatedFolders });
  };

  return (
    <a
      className={`flex items-center rounded-full shadow-md bg-gray-700 dark:bg-gray-300 hover:bg-gray-500 transition-all duration-200 text-white dark:text-black text-sm flex-shrink-0 py-2 px-5 gap-3 mb-2 ${
        generating
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer opacity-100'
      }`}
      onClick={() => {
        if (!generating) addFolder();
      }}
    >
      <NewFolderIcon />
    </a>
  );
};

export default NewFolder;

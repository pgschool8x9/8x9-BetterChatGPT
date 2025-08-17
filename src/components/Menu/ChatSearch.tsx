import React, { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import useStore from '@store/store';

import SearchBar from '@components/SearchBar';

const ChatSearch = ({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [_filter, _setFilter] = useState<string>(filter);
  const generating = useStore((state) => state.generating);
  const setSearchHighlightTerm = useStore((state) => state.setSearchHighlightTerm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setFilter(e.target.value);
  };

  const debouncedUpdateFilter = useRef(
    debounce((f) => {
      setFilter(f);
      setSearchHighlightTerm(f); // ハイライト用のstoreも更新
    }, 500)
  ).current;

  useEffect(() => {
    debouncedUpdateFilter(_filter);
  }, [_filter]);

  // 検索フィルターがクリアされた場合、ハイライトもクリア
  useEffect(() => {
    if (!filter) {
      setSearchHighlightTerm('');
    }
  }, [filter, setSearchHighlightTerm]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <SearchBar
        value={_filter}
        handleChange={handleChange}
        className='h-8 mb-4'
        disabled={generating}
      />
    </div>
  );
};

export default ChatSearch;

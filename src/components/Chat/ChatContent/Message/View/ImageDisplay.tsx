import React, { useState, useEffect } from 'react';
import { indexedDBManager } from '@utils/indexedDBManager';

interface ImageDisplayProps {
  imageUrl: string;
  alt: string;
  className?: string;
  onClick?: (url: string) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  alt,
  className = '',
  onClick,
}) => {
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        if (imageUrl.startsWith('indexeddb:')) {
          // IndexedDBからファイルIDを抽出
          const fileId = imageUrl.replace('indexeddb:', '');
          
          // IndexedDBから画像データを取得
          const blobUrl = await indexedDBManager.getFileURL(fileId);
          if (blobUrl) {
            setDisplayUrl(blobUrl);
          } else {
            throw new Error('画像が見つかりません');
          }
        } else {
          // 従来のbase64やURL画像
          setDisplayUrl(imageUrl);
        }
      } catch (err) {
        console.error('画像の読み込みに失敗しました:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (imageUrl) {
      loadImage();
    }

    // クリーンアップ: Blob URLを解放
    return () => {
      if (displayUrl && displayUrl.startsWith('blob:')) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [imageUrl]);

  const handleClick = () => {
    if (onClick && displayUrl) {
      onClick(displayUrl);
    }
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300`}>
        <div className="text-gray-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (error || !displayUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300`}>
        <div className="text-red-500 text-sm">画像を読み込めません</div>
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={`object-contain ${className}`}
      onClick={handleClick}
      onError={() => setError(true)}
      style={{ aspectRatio: 'auto' }}
    />
  );
};

export default ImageDisplay;
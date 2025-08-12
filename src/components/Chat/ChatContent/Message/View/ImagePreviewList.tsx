import React from 'react';
import { ContentInterface, ImageContentInterface, isImageContent } from '@type/chat';
import ImageDisplay from './ImageDisplay';
import CrossIcon from '@icon/CrossIcon';

interface ImagePreviewListProps {
  content: ContentInterface[];
  onRemoveImage: (index: number) => void;
  onImageClick?: (url: string) => void;
  className?: string;
}

const ImagePreviewList: React.FC<ImagePreviewListProps> = ({
  content,
  onRemoveImage,
  onImageClick,
  className = '',
}) => {
  // 画像コンテンツのみを抽出
  const imageContents = content.filter(isImageContent) as ImageContentInterface[];

  if (imageContents.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 sm:gap-2 ${className}`}>
      {imageContents.map((image, index) => {
        // 元のコンテンツ配列での実際のインデックスを取得
        const originalIndex = content.findIndex((item) => item === image);
        
        return (
          <div key={index} className="relative group">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800">
              <ImageDisplay
                imageUrl={image.image_url.url}
                alt={`preview-${index}`}
                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onImageClick}
              />
              
              {/* 削除ボタン */}
              <button
                onClick={() => onRemoveImage(originalIndex)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                title="画像を削除"
              >
                <CrossIcon className="w-3 h-3" />
              </button>
            </div>
            
            {/* 画質選択は常にautoのため、UIをシンプルに */}
          </div>
        );
      })}
    </div>
  );
};

export default ImagePreviewList;
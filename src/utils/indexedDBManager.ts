// IndexedDBファイル管理ユーティリティ
export interface FileMetadata {
  id: string;
  type: string;
  size: number;
  createdAt: number;
  name?: string;
}

export interface StoredFile {
  id: string;
  blob: Blob;
  metadata: FileMetadata;
}

class IndexedDBManager {
  private dbName = 'BetterChatGPT';
  private version = 1;
  private storeName = 'files';
  private db: IDBDatabase | null = null;

  // データベースを開く
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'metadata.createdAt', { unique: false });
          store.createIndex('type', 'metadata.type', { unique: false });
        }
      };
    });
  }

  // ファイルを保存
  async saveFile(blob: Blob, metadata?: Partial<FileMetadata>): Promise<string> {
    const db = await this.openDB();
    const id = this.generateId();
    
    // Blobのtypeを確認・修正
    let correctedBlob = blob;
    if (!blob.type || blob.type === '') {
      console.warn('Blob has no type, attempting to detect from filename');
      // ファイル名からMIMEタイプを推測
      if (metadata?.name) {
        const ext = metadata.name.toLowerCase().split('.').pop();
        const mimeMap: {[key: string]: string} = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'pdf': 'application/pdf'
        };
        const detectedType = ext ? mimeMap[ext] : null;
        if (detectedType) {
          correctedBlob = new Blob([blob], { type: detectedType });
          console.log('Corrected blob type from', blob.type, 'to', detectedType);
        }
      }
    }
    
    const fileMetadata: FileMetadata = {
      id,
      type: correctedBlob.type,
      size: correctedBlob.size,
      createdAt: Date.now(),
      name: metadata?.name,
      ...metadata,
    };

    console.log('saveFile: Storing file with metadata:', fileMetadata);

    const storedFile: StoredFile = {
      id,
      blob: correctedBlob,
      metadata: fileMetadata,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(storedFile);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // ファイルを取得
  async getFile(id: string): Promise<StoredFile | null> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ファイルのBlobURLを取得
  async getFileURL(id: string): Promise<string | null> {
    const file = await this.getFile(id);
    if (!file) return null;
    
    return URL.createObjectURL(file.blob);
  }

  // ファイルのbase64を取得
  async getFileBase64(id: string): Promise<string | null> {
    const file = await this.getFile(id);
    if (!file) {
      console.log('getFileBase64: File not found for id:', id);
      return null;
    }

    console.log('getFileBase64: File found:', {
      id,
      blobType: file.blob.type,
      blobSize: file.blob.size,
      metadata: file.metadata
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('getFileBase64: FileReader result:', {
          startsWithData: result.startsWith('data:'),
          mimeType: result.split(';')[0],
          preview: result.substring(0, 100)
        });
        resolve(result);
      };
      reader.onerror = () => {
        console.error('getFileBase64: FileReader error:', reader.error);
        reject(reader.error);
      };
      reader.readAsDataURL(file.blob);
    });
  }

  // ファイルを削除
  async deleteFile(id: string): Promise<boolean> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // 全ファイルのメタデータを取得
  async getAllMetadata(): Promise<FileMetadata[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as StoredFile[];
        resolve(files.map(file => file.metadata));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 使用容量を取得
  async getUsage(): Promise<number> {
    const metadata = await this.getAllMetadata();
    return metadata.reduce((total, file) => total + file.size, 0);
  }

  // 古いファイルを削除（指定日数より古い）
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    const db = await this.openDB();
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let cleanedSize = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('createdAt');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const file = cursor.value as StoredFile;
          cleanedSize += file.metadata.size;
          cursor.delete();
          cursor.continue();
        } else {
          resolve(cleanedSize);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 全ファイルを削除
  async clearAllFiles(): Promise<number> {
    const usage = await this.getUsage();
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(usage);
      request.onerror = () => reject(request.error);
    });
  }

  // ユニークIDを生成
  private generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // データベースを閉じる
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// シングルトンインスタンス
export const indexedDBManager = new IndexedDBManager();

// localStorage画像データをIndexedDBに移行
export const migrateImagesFromLocalStorage = async (): Promise<void> => {
  try {
    const chatsData = localStorage.getItem('chats');
    if (!chatsData) return;

    const chats = JSON.parse(chatsData);
    let hasChanges = false;

    for (const chat of chats) {
      if (chat.messages) {
        for (const message of chat.messages) {
          if (message.content && Array.isArray(message.content)) {
            for (const content of message.content) {
              if (content.type === 'image_url' && 
                  content.image_url?.url?.startsWith('data:image/')) {
                
                // base64からBlobに変換
                const response = await fetch(content.image_url.url);
                const blob = await response.blob();
                
                // IndexedDBに保存
                const fileId = await indexedDBManager.saveFile(blob, {
                  name: 'migrated_image',
                  type: blob.type,
                });

                // URLをファイルIDに変更
                content.image_url.url = `indexeddb:${fileId}`;
                hasChanges = true;
              }
            }
          }
        }
      }
    }

    if (hasChanges) {
      localStorage.setItem('chats', JSON.stringify(chats));
      console.log('画像データをIndexedDBに移行しました');
    }
  } catch (error) {
    console.error('画像データの移行中にエラーが発生しました:', error);
  }
};
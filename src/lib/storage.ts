import localforage from 'localforage';

// Configure localforage for document blob storage
localforage.config({
  name: 'DocScanPro',
  storeName: 'documents',
  description: 'Stores scanned images and generated PDF blobs for offline access'
});

export const storage = localforage;

export async function saveDocumentBlob(id: string, blob: Blob): Promise<string> {
  const key = `blob_${id}`;
  await storage.setItem(key, blob);
  return key;
}

export async function getDocumentBlob(key: string): Promise<Blob | null> {
  return await storage.getItem<Blob>(key);
}

export async function deleteDocumentBlob(key: string): Promise<void> {
  await storage.removeItem(key);
}

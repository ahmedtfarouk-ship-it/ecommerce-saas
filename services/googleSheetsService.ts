// services/googleSheetsService.ts

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GoogleSheetsSyncConfig } from '@/types/googleSheets';

const COLLECTION_NAME = 'google_sheets_sync_configs';

export async function saveGoogleSheetsConfig(
  config: Omit<GoogleSheetsSyncConfig, 'id'>,
  configId?: string
): Promise<string> {
  try {
    const configData: any = {
      tenantId: config.tenantId,
      sheetId: config.sheetId,
      range: config.range,
      apiKey: config.apiKey,
      isActive: config.isActive,
      createdBy: config.createdBy,
      updatedAt: Timestamp.now()
    };

    if (config.lastSyncAt) {
      configData.lastSyncAt = Timestamp.fromDate(config.lastSyncAt);
    }
    if (config.lastSyncStatus) {
      configData.lastSyncStatus = config.lastSyncStatus;
    }
    if (config.lastSyncMessage) {
      configData.lastSyncMessage = config.lastSyncMessage;
    }

    if (configId) {
      const configRef = doc(db, COLLECTION_NAME, configId);
      await updateDoc(configRef, configData);
      return configId;
    } else {
      configData.createdAt = Timestamp.now();
      const configRef = doc(collection(db, COLLECTION_NAME));
      await setDoc(configRef, configData);
      return configRef.id;
    }
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

export async function getGoogleSheetsConfig(
  tenantId: string
): Promise<GoogleSheetsSyncConfig | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('tenantId', '==', tenantId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      tenantId: data.tenantId,
      sheetId: data.sheetId,
      range: data.range,
      apiKey: data.apiKey,
      isActive: data.isActive,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastSyncAt: data.lastSyncAt?.toDate(),
      lastSyncStatus: data.lastSyncStatus,
      lastSyncMessage: data.lastSyncMessage
    };
  } catch (error) {
    console.error('Error getting config:', error);
    throw error;
  }
}

export async function updateSyncStatus(
  configId: string,
  lastSyncAt: Date,
  lastSyncStatus?: 'success' | 'error',
  lastSyncMessage?: string
): Promise<void> {
  try {
    const configRef = doc(db, COLLECTION_NAME, configId);
    const updateData: any = {
      lastSyncAt: Timestamp.fromDate(lastSyncAt),
      updatedAt: Timestamp.now()
    };

    if (lastSyncStatus) {
      updateData.lastSyncStatus = lastSyncStatus;
    }
    if (lastSyncMessage) {
      updateData.lastSyncMessage = lastSyncMessage;
    }

    await updateDoc(configRef, updateData);
  } catch (error) {
    console.error('Error updating sync status:', error);
    throw error;
  }
}

export async function disableGoogleSheetsSync(configId: string): Promise<void> {
  try {
    const configRef = doc(db, COLLECTION_NAME, configId);
    await updateDoc(configRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error disabling sync:', error);
    throw error;
  }
}
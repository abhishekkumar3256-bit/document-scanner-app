export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface ScannedDocument {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'pdf' | 'jpg' | 'png' | 'docx' | 'xlsx';
  size: number;
  localFileKey: string;
  createdAt: any;
  updatedAt?: any;
  aiSummary?: string;
  tags?: string[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

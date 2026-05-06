import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { ScannedDocument, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { FileText, MoreVertical, Calendar, HardDrive } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentListProps {
  onViewDoc: (id: string) => void;
}

export default function DocumentList({ onViewDoc }: DocumentListProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsArr: ScannedDocument[] = [];
      snapshot.forEach((doc) => {
        docsArr.push({ ...doc.data(), firebaseId: doc.id } as any);
      });
      setDocuments(docsArr);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <p className="font-medium">No documents yet</p>
        <p className="text-sm">Start scanning to see them here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onViewDoc((doc as any).firebaseId)}
          className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            {doc.type === 'pdf' ? <FileText /> : <FileText />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {doc.createdAt?.seconds ? format(new Date(doc.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Recent'}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {(doc.size / 1024).toFixed(0)} KB
              </span>
            </div>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-300" />
        </button>
      ))}
    </div>
  );
}

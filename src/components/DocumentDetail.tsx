import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getDocumentBlob, deleteDocumentBlob } from '../lib/storage';
import { ScannedDocument, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { 
  ChevronLeft, 
  Share2, 
  Trash2, 
  Download, 
  FileText, 
  MoreVertical,
  PlusCircle,
  FileSearch,
  Languages,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from '@google/genai';

interface DocumentDetailProps {
  id: string;
  onClose: () => void;
}

export default function DocumentDetail({ id, onClose }: DocumentDetailProps) {
  const [document, setDocument] = useState<ScannedDocument | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const docSnap = await getDoc(doc(db, 'documents', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as ScannedDocument;
          setDocument(data);
          const blob = await getDocumentBlob(data.localFileKey);
          if (blob) {
            setBlobUrl(URL.createObjectURL(blob));
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `documents/${id}`);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [id]);

  const handleDelete = async () => {
    if (!document) return;
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDoc(doc(db, 'documents', id));
        await deleteDocumentBlob(document.localFileKey);
        onClose();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
      }
    }
  };

  const generatePDF = async () => {
    if (!document || !blobUrl) return;
    const pdf = new jsPDF();
    const img = new Image();
    img.src = blobUrl;
    await new Promise(resolve => img.onload = resolve);
    
    const imgProps = pdf.getImageProperties(img);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${document.title}.pdf`);
  };

  const summarizeAI = async () => {
    if (!blobUrl || !document) return;
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const responsiveBlob = await fetch(blobUrl).then(r => r.blob());
      const reader = new FileReader();
      const base64Promise = new Promise<string>(resolve => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(responsiveBlob);
      const base64 = (await base64Promise).split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Please summarize this document concisely." },
            { inlineData: { mimeType: "image/jpeg", data: base64 } }
          ]
        }
      });

      const summary = response.text;
      if (summary) {
        await updateDoc(doc(db, 'documents', id), {
          aiSummary: summary,
          updatedAt: serverTimestamp()
        });
        setDocument(prev => prev ? { ...prev, aiSummary: summary } : null);
      }
    } catch (err) {
      console.error('AI Error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const shareDoc = async (format: 'pdf' | 'jpg') => {
    if (!blobUrl || !document) return;
    
    const fileToShare = format === 'jpg' 
      ? await fetch(blobUrl).then(r => r.blob())
      : null; // For simplicity, we just share the image for now
      
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: document.aiSummary || 'Shared from DocScan Pro',
          files: fileToShare ? [new File([fileToShare], `${document.title}.jpg`, { type: 'image/jpeg' })] : undefined
        });
      } catch (err) {
        console.error('Share error:', err);
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  if (loading) return <div className="p-12 text-center">Loading document...</div>;
  if (!document) return <div className="p-12 text-center">Document not found</div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={onClose} className="p-2 border border-gray-100 rounded-xl"><ChevronLeft /></button>
        <h2 className="font-bold text-lg truncate max-w-[200px]">{document.title}</h2>
        <button onClick={() => setShowShareOptions(true)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
          <Share2 size={20} />
        </button>
      </header>

      <div className="p-6 flex flex-col gap-6">
        <div className="w-full aspect-[3/4] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-inner relative group">
          {blobUrl && <img src={blobUrl} className="w-full h-full object-contain" alt="Document content" />}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={generatePDF} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={summarizeAI} 
            disabled={aiLoading}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100 active:scale-95 transition-transform"
          >
            {aiLoading ? (
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
            <span className="text-[10px] uppercase font-black">AI Summarize</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100 active:scale-95 transition-transform">
            <Languages className="w-6 h-6" />
            <span className="text-[10px] uppercase font-black">AI Translate</span>
          </button>
        </div>

        {document.aiSummary && (
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
            <h3 className="text-xs uppercase font-black text-blue-800 mb-3 flex items-center gap-2">
              <FileSearch size={14} /> AI Summary
            </h3>
            <p className="text-sm text-blue-900 leading-relaxed italic">
              {document.aiSummary}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
           <button onClick={handleDelete} className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
             <Trash2 size={16} /> Delete Document
           </button>
           <button className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
             <PlusCircle size={16} /> Add Page
           </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareOptions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareOptions(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
             <h3 className="text-xl font-bold mb-6">Share File</h3>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { shareDoc('pdf'); setShowShareOptions(false); }} className="flex flex-col items-center gap-3 p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100">
                  <FileText size={32} />
                  <span className="font-bold">PDF Format</span>
                </button>
                <button onClick={() => { shareDoc('jpg'); setShowShareOptions(false); }} className="flex flex-col items-center gap-3 p-6 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100">
                  <Share2 size={32} />
                  <span className="font-bold">Image Format</span>
                </button>
             </div>
             <button onClick={() => setShowShareOptions(false)} className="w-full mt-6 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500 uppercase tracking-widest text-xs">
               Cancel
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

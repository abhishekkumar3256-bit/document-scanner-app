import React, { useState, useEffect } from 'react';
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
  PlusCircle,
  FileSearch,
  Languages,
  Sparkles,
  Table,
  FileCode
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfToText from 'react-pdftotext';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

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
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [wordHtml, setWordHtml] = useState<string>('');

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
            
            if (data.type === 'xlsx') {
              const arrayBuffer = await blob.arrayBuffer();
              const workbook = XLSX.read(arrayBuffer);
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
              setExcelData(rows as any[][]);
            } else if (data.type === 'docx') {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer });
              setWordHtml(result.value);
            }
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
  }, [id, blobUrl]);

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey) {
      alert("Please configure your GEMINI_API_KEY in the Secrets tab to use AI features.");
      return;
    }
    setAiLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let prompt = "Please provide a concise and professional summary of this document. Focus on key details, dates, and names.";
      let parts: any[] = [];

      if (document.type === 'pdf') {
        const blob = await fetch(blobUrl).then(r => r.blob());
        const text = await pdfToText(blob);
        parts.push({ text: `${prompt}\n\nDocument Text Content:\n${text}` });
      } else {
        const responsiveBlob = await fetch(blobUrl).then(r => r.blob());
        const reader = new FileReader();
        const base64Promise = new Promise<string>(resolve => {
          reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');
        });
        reader.readAsDataURL(responsiveBlob);
        const base64Data = await base64Promise;
        parts = [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          }
        ];
      }

      const result = await model.generateContent(parts);
      const summaryText = result.response.text();
      
      if (summaryText) {
        await updateDoc(doc(db, 'documents', id), {
          aiSummary: summaryText,
          updatedAt: serverTimestamp()
        });
        setDocument(prev => prev ? { ...prev, aiSummary: summaryText } : null);
      }
    } catch (err) {
      console.error('AI Error:', err);
      alert("AI feature experienced an error. Please ensure your Gemini API key is valid.");
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
        <div className="w-full min-h-[400px] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-inner relative group p-4">
          {document.type === 'jpg' || document.type === 'png' ? (
            blobUrl && <img src={blobUrl} className="w-full h-full object-contain mx-auto" alt="Document content" />
          ) : document.type === 'xlsx' ? (
            <div className="overflow-auto max-h-[600px] w-full">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {excelData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 whitespace-nowrap">{String(cell || '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : document.type === 'docx' ? (
            <div className="prose prose-sm max-w-none prose-slate overflow-auto max-h-[600px] w-full p-4 bg-white rounded-xl shadow-sm" dangerouslySetInnerHTML={{ __html: wordHtml }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <FileCode size={48} className="mb-4 opacity-20" />
              <p className="font-bold">PDF / File Preview</p>
              <p className="text-xs">Previewing of this format is coming soon</p>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={generatePDF} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <Download size={14} /> Save as PDF
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

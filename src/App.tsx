import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  FileText, 
  User as UserIcon, 
  Search, 
  Settings,
  Layout
} from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Scanner from './components/Scanner';
import Editor from './components/Editor';
import DocumentList from './components/DocumentList';
import DocumentDetail from './components/DocumentDetail';
import Profile from './components/Profile';

function AppContent() {
  const { user, loading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'scanner' | 'profile'>('home');
  const [editingBlob, setEditingBlob] = useState<Blob | null>(null);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-6 text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl shadow-blue-200">
          <FileText className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">DocScan Pro</h1>
        <p className="text-gray-500 mb-14 max-w-xs font-medium leading-relaxed">
          The ultimate AI-powered scanner for your pocket. Secure, offline, and smart.
        </p>
        <button 
          onClick={signIn}
          className="w-full max-w-sm py-5 bg-black text-white rounded-[24px] font-black shadow-2xl hover:bg-gray-900 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5 bg-white rounded-full p-0.5" alt="Google" />
          Get Started with Google
        </button>
        <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          No credit card required • Offline Access
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans max-w-md mx-auto relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.1)] border-x border-gray-100">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter">
          {activeTab === 'home' && 'My Vault'}
          {activeTab === 'scanner' && 'Quick Scan'}
          {activeTab === 'profile' && 'Account'}
        </h1>
        <div className="flex gap-4">
          <button className="p-2 bg-gray-50 rounded-xl text-gray-400"><Search size={20} /></button>
          <button className="p-2 bg-gray-50 rounded-xl text-gray-400"><Settings size={20} /></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6"
            >
              <DocumentList 
                onViewDoc={(id) => setViewingDocId(id)}
              />
            </motion.div>
          )}

          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50"
            >
              <Scanner 
                onCapture={(blob) => setEditingBlob(blob)} 
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6"
            >
              <Profile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-2xl border-t border-gray-100 flex items-center justify-around py-4 px-8 fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-gray-300'}`}
        >
          <Layout className="w-6 h-6" />
          <span className="text-[9px] uppercase font-black tracking-[0.15em]">Vault</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('scanner')}
          className="bg-blue-600 text-white p-5 rounded-[28px] shadow-2xl shadow-blue-300 -mt-20 hover:scale-105 active:scale-95 transition-all"
        >
          <Camera className="w-8 h-8" />
        </button>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'text-blue-600 scale-110' : 'text-gray-300'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[9px] uppercase font-black tracking-[0.15em]">User</span>
        </button>
      </nav>

      {/* Editing Overlay */}
      <AnimatePresence>
        {editingBlob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <Editor 
              blob={editingBlob} 
              onCancel={() => {
                 setEditingBlob(null);
                 setActiveTab('home');
              }}
              onSave={() => {
                setEditingBlob(null);
                setActiveTab('home');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Document Overlay */}
      <AnimatePresence>
        {viewingDocId && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white mt-12 rounded-t-[40px] shadow-2xl overflow-hidden"
          >
            <DocumentDetail 
              id={viewingDocId} 
              onClose={() => setViewingDocId(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

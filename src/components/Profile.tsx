import { useAuth } from './AuthContext';
import { LogOut, Mail, Calendar, Shield, CreditCard, ChevronRight, HardDrive } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';

export default function Profile() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Card */}
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl ring-4 ring-blue-50">
          <img 
            src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`} 
            className="w-full h-full object-cover" 
            alt="Profile" 
          />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{profile.displayName || 'Guest User'}</h2>
          <p className="text-gray-400 font-medium text-sm flex items-center justify-center gap-1">
            <Mail className="w-3 h-3 text-gray-300" />
            {profile.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Storage Used</p>
          <div className="flex items-end gap-1">
            <span className="text-xl font-black text-blue-600 tracking-tighter">4.2</span>
            <span className="text-[10px] font-bold text-gray-300 pb-1">MB</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full mt-3">
             <div className="w-1/4 h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Documents</p>
          <div className="flex items-end gap-1">
            <span className="text-xl font-black text-gray-900 tracking-tighter">12</span>
            <span className="text-[10px] font-bold text-gray-300 pb-1">Total</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full mt-3"></div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase font-black text-gray-400 px-4 mb-2 tracking-widest">Settings & Security</h3>
        
        <MenuButton icon={<Shield className="w-5 h-5" />} label="Security & Privacy" />
        <MenuButton icon={<CreditCard className="w-5 h-5" />} label="Premium Features" badge="PRO" />
        <MenuButton icon={<HardDrive className="w-5 h-5" />} label="Storage Management" />
        <MenuButton icon={<Calendar className="w-5 h-5" />} label="Member Since" sub={profile.createdAt?.seconds ? format(new Date(profile.createdAt.seconds * 1000), 'MMMM yyyy') : 'Loading...'} />
        
        <button 
          onClick={signOut}
          className="w-full mt-4 flex items-center justify-between p-5 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 hover:bg-rose-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Sign Out Account</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-30" />
        </button>
      </div>
      
      <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest py-8">
        DocScan Pro v1.0.0
      </p>
    </div>
  );
}

function MenuButton({ icon, label, badge, sub }: { icon: React.ReactNode, label: string, badge?: string, sub?: string }) {
  return (
    <button className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all group">
      <div className="flex items-center gap-4">
        <div className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</div>
        <div className="text-left">
          <p className="font-bold text-gray-900 text-sm leading-none">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 font-bold uppercase mt-1.5 tracking-wider">{sub}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full">{badge}</span>}
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  );
}

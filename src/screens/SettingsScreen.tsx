import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Shield,
  Lock,
  UserX,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Check,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { CopyrightGuidelinesModal } from '../components/CopyrightGuidelinesModal';

export const SettingsScreen: React.FC = () => {
  const {
    currentUser,
    blockedUsers,
    unblockUser,
    logout,
    navigateTo,
    showToast,
  } = useApp();

  const [isPrivate, setIsPrivate] = useState(false);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [accentTheme, setAccentTheme] = useState('sunset'); // 'sunset' | 'cyan' | 'violet'
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  const safeBlockedUsers = blockedUsers || [];

  return (
    <div id="loksy-settings-screen" className="w-full max-w-xl mx-auto px-4 py-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
        <Settings className="w-5 h-5 text-[#FF8A00]" />
        <h2 className="text-base font-bold text-white">Settings & Privacy</h2>
      </div>

      {/* Account Info Pill */}
      <div className="bg-[#0B0F19] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#FF4668]/30">
            <img
              src={currentUser.avatar}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{currentUser.name}</h3>
            <p className="text-xs text-gray-400">@{currentUser.username}</p>
            <p className="text-[11px] text-[#00E5FF] mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={() => navigateTo('edit_profile')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white"
        >
          Edit
        </button>
      </div>

      {/* Privacy Section */}
      <div className="bg-[#0B0F19] p-5 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Account Privacy</span>
        </div>

        {/* Private Account Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">Private Account</h4>
            <p className="text-[11px] text-gray-400">
              Only approved followers can view your posts and reels.
            </p>
          </div>
          <button
            onClick={() => {
              setIsPrivate(!isPrivate);
              showToast(isPrivate ? 'Account is now public' : 'Account is now private 🔒');
            }}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              isPrivate ? 'bg-[#FF4668]' : 'bg-white/15'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isPrivate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Direct Messages permission */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <h4 className="text-xs font-bold text-white">Allow Direct Messages</h4>
            <p className="text-[11px] text-gray-400">
              Receive messages from people you don't follow yet.
            </p>
          </div>
          <button
            onClick={() => {
              setAllowDirectMessages(!allowDirectMessages);
              showToast('DM settings updated');
            }}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              allowDirectMessages ? 'bg-[#00E5FF]' : 'bg-white/15'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                allowDirectMessages ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Blocked Accounts Management */}
      <div className="bg-[#0B0F19] p-5 rounded-3xl border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
          <UserX className="w-3.5 h-3.5 text-rose-400" />
          <span>Blocked Accounts ({safeBlockedUsers.length})</span>
        </div>

        {safeBlockedUsers.length === 0 ? (
          <p className="text-xs text-gray-500 py-1">
            You haven't blocked any accounts. Safe and peaceful community!
          </p>
        ) : (
          <div className="space-y-2 pt-1">
            {safeBlockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{user.name}</span>
                    <span className="text-[10px] text-gray-400 block">@{user.username}</span>
                  </div>
                </div>

                <button
                  onClick={() => unblockUser(user.id)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Language & Theme */}
      <div className="bg-[#0B0F19] p-5 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5 text-[#FFA000]" />
          <span>Language & Regional Display</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSelectedLanguage('en');
              showToast('Language set to English');
            }}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
              selectedLanguage === 'en'
                ? 'bg-[#FF4668]/15 border-[#FF4668] text-white'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <span>English (Default)</span>
            {selectedLanguage === 'en' && <Check className="w-4 h-4 text-[#FF4668]" />}
          </button>

          <button
            onClick={() => {
              setSelectedLanguage('hi');
              showToast('भाषा हिन्दी सेट की गई');
            }}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
              selectedLanguage === 'hi'
                ? 'bg-[#FF4668]/15 border-[#FF4668] text-white'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <span>हिन्दी (Hindi)</span>
            {selectedLanguage === 'hi' && <Check className="w-4 h-4 text-[#FF4668]" />}
          </button>
        </div>
      </div>

      {/* Safety & Guidelines Center */}
      <div className="bg-[#0B0F19] p-5 rounded-3xl border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>LOKSY Community Guidelines & Music Copyright</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          LOKSY stands for mutual respect, creative freedom, regional harmony, and genuine cultural appreciation across Bharat. Harassment, hateful speech, and music piracy are strictly prohibited.
        </p>

        <button
          id="settings-open-guidelines-btn"
          type="button"
          onClick={() => setShowGuidelinesModal(true)}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Scale className="w-4 h-4" />
          <span>Read Copyright & Community Guidelines</span>
        </button>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of LOKSY</span>
        </button>
      </div>

      {/* Copyright & Community Guidelines Modal */}
      <CopyrightGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
};

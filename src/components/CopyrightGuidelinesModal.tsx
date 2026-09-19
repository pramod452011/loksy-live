import React, { useState } from 'react';
import {
  X,
  Shield,
  FileText,
  AlertTriangle,
  Music,
  Scale,
  CheckCircle2,
  HeartHandshake,
  ExternalLink,
  BookOpen,
  Sparkles,
  Lock,
  Search,
} from 'lucide-react';

interface CopyrightGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'copyright' | 'community' | 'creator';
}

export const CopyrightGuidelinesModal: React.FC<CopyrightGuidelinesModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'copyright',
}) => {
  const [activeTab, setActiveTab] = useState<'copyright' | 'community' | 'creator'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div
      id="loksy-copyright-guidelines-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0B0F19] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF4668] to-[#FF8A00] flex items-center justify-center text-white shadow-lg shadow-[#FF4668]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight flex items-center gap-2">
                Copyright & Community Guidelines
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                  Official Policy
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Protecting creators, intellectual property, and community safety across Bharat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-white/[0.01] px-5 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('copyright')}
            className={`py-3 text-xs font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'copyright'
                ? 'text-[#FF4668]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Copyright & Music Protection</span>
            {activeTab === 'copyright' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4668]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`py-3 text-xs font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'community'
                ? 'text-[#FF8A00]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Community Standards</span>
            {activeTab === 'community' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF8A00]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('creator')}
            className={`py-3 text-xs font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'creator'
                ? 'text-[#00E5FF]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Fair Use & Creator Rights</span>
            {activeTab === 'creator' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5FF]" />
            )}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-gray-300 text-xs leading-relaxed">
          {/* Copyright Section */}
          {activeTab === 'copyright' && (
            <div className="space-y-4">
              {/* Highlight Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF4668]/10 via-[#FF8A00]/5 to-transparent border border-[#FF4668]/20 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Music className="w-4 h-4 text-[#FF4668]" />
                  <span>Automatic Content ID & Music Licensing</span>
                </div>
                <p className="text-gray-300">
                  When you upload posts or reels on LOKSY, our automated Content ID engine scans audio fingerprints against commercial catalogs (T-Series, Sony Music, Saregama, Zee Music, and IPRS).
                </p>
              </div>

              {/* Point 1 */}
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  1. Commercial Audio vs. Original Sounds
                </h4>
                <p>
                  Creators may use commercial songs for expressive personal clips. If commercial audio is detected, attribution is automatically displayed. In select territories or monetization programs, advertising revenue may be shared with the certified music rights holder.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
                  <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px]">Option: Mute Audio</span>
                  <span>Allows instant posting without copyright claims.</span>
                </div>
              </div>

              {/* Point 2 */}
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  2. Visual Art & Photography Protection
                </h4>
                <p>
                  Only upload photos, graphics, artwork, and videos that you created or have explicit permission to distribute. Reposting uncredited third-party art, watermarked agency footage, or stolen creative work is strictly prohibited.
                </p>
              </div>

              {/* Point 3 */}
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  3. DMCA & Indian Copyright Act (Section 52) Takedowns
                </h4>
                <p>
                  Rights owners can submit an infringement takedown notice. Upon verification, the disputed content will be promptly restricted, and the creator will receive a formal notification with the opportunity to file a counter-notice within 14 business days.
                </p>
                <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-gray-400">
                  Contact our designated Copyright Agent at{' '}
                  <span className="text-[#00E5FF] font-mono">copyright@loksy.app</span>
                </div>
              </div>
            </div>
          )}

          {/* Community Standards Section */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0E1322] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                  LOKSY Community Code of Honor
                </h3>
                <p className="text-gray-300">
                  LOKSY is built to celebrate the cultural vibrance, languages, and creative energy of India. We uphold zero tolerance for toxicity and hate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Zero Hate Speech</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Attacks on race, caste, religion, gender, sexual orientation, disability, or regional background result in immediate suspension.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Harassment & Bullying</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Targeted dogpiling, doxxing, non-consensual imagery, and stalking are forbidden across comments, reels, and direct messages.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Authenticity & Spam</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Fake accounts, engagement farming bots, malicious links, and misleading financial scams are permanently blocked.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cultural Respect</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Embrace diversity across Indian states, folk heritage, vernacular languages, and independent creator voices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Creator & Fair Use Section */}
          {activeTab === 'creator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-[#00E5FF]" />
                  What Qualifies as Fair Use / Fair Dealing?
                </h4>
                <p>
                  Under Section 52 of the Indian Copyright Act, 1957, certain uses of copyrighted material do not constitute an infringement:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-gray-300">
                  <li>Fair dealing for private or personal use, including research and critique</li>
                  <li>Parody, satire, commentary, and transformative reviews</li>
                  <li>Reporting current events and cultural affairs with appropriate attribution</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
                  LOKSY Royalty-Free Creator Sound Library
                </h4>
                <p>
                  All audio tracks tagged as <span className="font-semibold text-white">LOKSY Originals</span> or created with our in-app synthesizers and indie studio partners are 100% royalty-free and cleared for worldwide commercial monetization.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Last revised: September 2026 • LOKSY Legal & Trust
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

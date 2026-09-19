import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Check, Send, Share2 } from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { shareModalItem, closeShareModal, users, sendMessage, showToast } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!shareModalItem) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareModalItem.url || window.location.href);
    setCopied(true);
    showToast('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDM = (targetUserId: string, targetName: string) => {
    sendMessage(`chat_${targetUserId}`, `Shared this post with you: ${shareModalItem.title} - ${shareModalItem.url}`);
    showToast(`Sent to ${targetName}! 🚀`);
    closeShareModal();
  };

  return (
    <div
      id="loksy-share-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={closeShareModal}
    >
      <div
        className="w-full max-w-md bg-[#0F1423] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="font-bold text-white text-base">Share with Friends</h3>
          </div>
          <button
            onClick={closeShareModal}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Send to LOKSY Friends */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-3">Send in LOKSY Chat</p>
          <div className="grid grid-cols-4 gap-2">
            {users.slice(0, 4).map((user) => (
              <button
                key={user.id}
                onClick={() => handleSendDM(user.id, user.name)}
                className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] hover:bg-white/10 border border-white/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1.5 group-hover:scale-105 transition-transform">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[11px] font-medium text-white truncate max-w-[65px] text-center">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-[#00E5FF] mt-0.5 flex items-center gap-0.5">
                  <Send className="w-2.5 h-2.5" /> Send
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link & Social Row */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
          >
            <div className="flex items-center gap-2.5 truncate mr-2">
              <Copy className="w-4 h-4 text-[#FF8A00] shrink-0" />
              <span className="truncate text-gray-300">
                {shareModalItem.url || window.location.href}
              </span>
            </div>
            <span className="shrink-0 text-[#FF8A00] font-bold">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `${shareModalItem.title} on LOKSY: ${shareModalItem.url || window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Share on WhatsApp</span>
            </a>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: shareModalItem.title,
                    url: shareModalItem.url,
                  }).catch(() => {});
                } else {
                  handleCopy();
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>More Options...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

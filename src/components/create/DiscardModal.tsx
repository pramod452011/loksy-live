import React from 'react';

interface DiscardModalProps {
  isOpen: boolean;
  onDiscard: () => void;
  onCancel: () => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({
  isOpen,
  onDiscard,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="instagram-discard-dialog-backdrop"
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        id="instagram-discard-dialog-card"
        className="w-full max-w-sm bg-[#1e232e] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 text-center animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-1.5">Discard post?</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            If you leave, your edits won't be saved.
          </p>
        </div>

        <div className="border-t border-white/10 flex flex-col">
          <button
            id="instagram-discard-confirm-btn"
            type="button"
            onClick={onDiscard}
            className="w-full py-3.5 text-sm font-bold text-[#FF4668] hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer border-b border-white/10"
          >
            Discard
          </button>
          <button
            id="instagram-discard-cancel-btn"
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 text-sm font-medium text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

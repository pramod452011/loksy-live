import React, { useState } from 'react';
import {
  X,
  VolumeX,
  Volume2,
  Music,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Scale,
  CheckCircle2,
  FileText,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CopyrightClaim } from '../types';
import {
  ROYALTY_FREE_AUDIO_LIBRARY,
  RoyaltyFreeAudioTrack,
} from '../utils/copyrightAuditor';
import { soundManager } from '../utils/audioEngine';

interface CopyrightDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: CopyrightClaim | null;
  target: {
    type: 'post' | 'reel';
    id: string;
    title?: string;
    artist?: string;
  } | null;
  onDispute: (
    targetId: string,
    targetType: 'post' | 'reel',
    reason: string,
    notes?: string
  ) => Promise<void>;
  onReplaceAudio: (
    targetId: string,
    targetType: 'post' | 'reel',
    track: RoyaltyFreeAudioTrack
  ) => Promise<void>;
  onOpenGuidelines?: () => void;
}

export const CopyrightDetailsModal: React.FC<CopyrightDetailsModalProps> = ({
  isOpen,
  onClose,
  claim,
  target,
  onDispute,
  onReplaceAudio,
  onOpenGuidelines,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'replace' | 'dispute'>('details');

  // Replace Audio State
  const [selectedTrack, setSelectedTrack] = useState<RoyaltyFreeAudioTrack>(
    ROYALTY_FREE_AUDIO_LIBRARY[0]
  );
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Dispute State
  const [disputeReason, setDisputeReason] = useState<string>(
    'I have a license or written permission from the rights holder'
  );
  const [disputeNotes, setDisputeNotes] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  if (!isOpen || !claim || !target) return null;

  const handleTogglePreview = (track: RoyaltyFreeAudioTrack) => {
    if (previewTrackId === track.id) {
      soundManager.stopSoundtrack();
      setPreviewTrackId(null);
    } else {
      soundManager.playSoundtrack(track.title, 'ambient');
      soundManager.setMuted(false);
      setPreviewTrackId(track.id);
    }
  };

  const handleApplyReplacement = async () => {
    setIsReplacing(true);
    soundManager.stopSoundtrack();
    try {
      await onReplaceAudio(target.id, target.type, selectedTrack);
      onClose();
    } finally {
      setIsReplacing(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;

    setIsSubmittingDispute(true);
    try {
      await onDispute(target.id, target.type, disputeReason, disputeNotes);
      onClose();
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleClose = () => {
    soundManager.stopSoundtrack();
    onClose();
  };

  return (
    <div
      id="loksy-copyright-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-[#0B0F19] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2">
                Copyright Notice
                {claim.status === 'disputed' ? (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold">
                    Dispute Under Review
                  </span>
                ) : claim.isAudioMuted ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                    <VolumeX className="w-3 h-3" />
                    Audio Muted
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                    Notice Attached
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Content ID automated media match on {target.type === 'post' ? 'Post' : 'Reel'}
              </p>
            </div>
          </div>
          <button
            id="close-copyright-details-modal"
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/[0.01] px-5 gap-4">
          <button
            id="copyright-tab-details"
            onClick={() => setActiveTab('details')}
            className={`py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'text-[#00E5FF]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Match Details</span>
            {activeTab === 'details' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5FF]" />
            )}
          </button>

          {claim.isAudioMuted && (
            <button
              id="copyright-tab-replace"
              onClick={() => setActiveTab('replace')}
              className={`py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'replace'
                  ? 'text-[#FF4668]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Replace Audio</span>
              {activeTab === 'replace' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4668]" />
              )}
            </button>
          )}

          <button
            id="copyright-tab-dispute"
            onClick={() => setActiveTab('dispute')}
            className={`py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'dispute'
                ? 'text-[#FFA000]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Dispute Claim</span>
            {activeTab === 'dispute' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFA000]" />
            )}
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Audio Match Section */}
            {claim.audioTrack && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                    <VolumeX className="w-4 h-4" />
                    <span>Commercial Audio Detected</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold">
                    Muted
                  </span>
                </div>

                <div className="space-y-1.5 pl-6 border-l-2 border-rose-500/30">
                  <p className="text-sm font-bold text-white leading-tight">
                    {claim.audioTrack}
                  </p>
                  <p className="text-xs text-gray-300">
                    <span className="text-gray-400">Artist:</span> {claim.audioArtist || 'Commercial Artist'}
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className="text-gray-500">Claimant:</span> {claim.audioClaimant || 'Music Publishing Rights Organization'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span>
                    The rights holder has chosen to mute audio on posts utilizing their recording. Your account standing has not been penalized.
                  </span>
                </div>
              </div>
            )}

            {/* Visual Match Section */}
            {claim.hasVisualWarning && (
              <div className="p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Visual Content Fingerprint Match</span>
                </div>

                <div className="space-y-1 pl-6 border-l-2 border-amber-500/30 text-xs">
                  <p className="font-semibold text-white">
                    {claim.visualDetails || 'Protected broadcast / still media fingerprint'}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Claimant:</span> {claim.visualClaimant || 'Commercial Media Rights Entity'}
                  </p>
                </div>

                <p className="text-[11px] text-gray-300">
                  ⚠️ A discreet warning tag is displayed with your post informing viewers of the copyright match.
                </p>
              </div>
            )}

            {/* Status & Options Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {claim.isAudioMuted && (
                <button
                  id="btn-switch-to-replace"
                  onClick={() => setActiveTab('replace')}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] hover:opacity-90 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF4668]/20 transition-all"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Replace Audio Track</span>
                </button>
              )}

              <button
                id="btn-switch-to-dispute"
                onClick={() => setActiveTab('dispute')}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-gray-200 font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
              >
                <Scale className="w-3.5 h-3.5 text-[#FFA000]" />
                <span>Dispute This Match</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Replace Audio */}
        {activeTab === 'replace' && (
          <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#FF4668]" />
                <span>Royalty-Free LOKSY Music Library</span>
              </h3>
              <p className="text-xs text-gray-400">
                Swap the flagged audio with a pre-cleared track. Your post will instantly unmute and all strikes will be removed.
              </p>
            </div>

            <div className="space-y-2">
              {ROYALTY_FREE_AUDIO_LIBRARY.map((track) => {
                const isSelected = selectedTrack.id === track.id;
                const isPreviewing = previewTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrack(track)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FF4668]/10 border-[#FF4668]/50 ring-1 ring-[#FF4668]/30'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePreview(track);
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isPreviewing
                            ? 'bg-[#FF4668] text-white shadow-lg shadow-[#FF4668]/30'
                            : 'bg-white/10 text-gray-300 hover:text-white'
                        }`}
                        title={isPreviewing ? 'Stop Preview' : 'Listen to Track'}
                      >
                        {isPreviewing ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 translate-x-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {track.artist} • <span className="text-[#00E5FF]">{track.genre}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Claim-Free
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#FF4668] bg-[#FF4668]'
                            : 'border-white/30'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                id="btn-apply-replacement-audio"
                type="button"
                disabled={isReplacing}
                onClick={handleApplyReplacement}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] hover:opacity-90 active:scale-95 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-[#FF4668]/20 transition-all"
              >
                {isReplacing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Replacing Audio Track...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Apply Audio & Unmute Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Dispute Claim */}
        {activeTab === 'dispute' && (
          <form onSubmit={handleSubmitDispute} className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#FFA000]" />
                <span>Submit Copyright Dispute</span>
              </h3>
              <p className="text-xs text-gray-400">
                If you believe this match was made in error or you hold valid licensing/fair-use rights, you can dispute the claim. Audio is temporarily restored during the review period.
              </p>
            </div>

            {/* Dispute Reasons */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-300 block">
                Select Grounds for Dispute:
              </label>
              {[
                'I have a license or written permission from the rights holder',
                'Fair Use (Commentary, criticism, parody, or educational transformation)',
                'Public domain or original independent composition',
                'Content was misidentified by automated Content ID',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    disputeReason === reason
                      ? 'bg-[#FFA000]/10 border-[#FFA000]/40 text-white'
                      : 'bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="radio"
                    name="dispute_reason"
                    checked={disputeReason === reason}
                    onChange={() => setDisputeReason(reason)}
                    className="mt-0.5 accent-[#FFA000]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Explanation Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-300 block">
                Supporting Explanation (Optional):
              </label>
              <textarea
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                placeholder="Provide contract details, license number, or Fair Use context..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFA000] resize-none"
              />
            </div>

            {/* Legal Acknowledgment */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 accent-[#FFA000] rounded"
                required
              />
              <span className="text-[11px] leading-relaxed text-gray-400">
                I affirm under penalty of perjury that I have a good-faith belief that this content was flagged as a result of mistake or misidentification.
              </span>
            </label>

            <button
              id="btn-submit-copyright-dispute"
              type="submit"
              disabled={!agreedToTerms || isSubmittingDispute}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FFA000] to-[#FF8A00] hover:opacity-90 active:scale-95 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-[#FFA000]/20 transition-all"
            >
              {isSubmittingDispute ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Submitting Dispute...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Submit Dispute & Restore Audio</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info link */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-gray-400">
          <span>LOKSY Content ID System v2.4</span>
          {onOpenGuidelines && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGuidelines();
              }}
              className="text-[#00E5FF] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Copyright Policies</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CopyrightGuidelinesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="copyright-guidelines-modal-overlay"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0F1423] border border-white/15 rounded-3xl overflow-hidden shadow-2xl animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">LOKSY Copyright & Content ID Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-gray-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Music className="w-4 h-4 text-[#FF4668]" />
              Commercial Music Policy
            </h4>
            <p className="text-gray-400">
              When you post videos or reels featuring commercial music (e.g. tracks licensed to Sony Music, T-Series, Zee Music, or IPRS), automated Content ID may mute the audio in jurisdictions where licenses are not established.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              1-Tap Audio Replacement
            </h4>
            <p className="text-gray-400">
              You can immediately replace flagged audio with any certified royalty-free track from our curated Desi & Global library without re-uploading your video.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#FFA000]" />
              Dispute & Fair Use Process
            </h4>
            <p className="text-gray-400">
              If you own the rights, hold an express license, or believe your usage qualifies as Fair Use / Fair Dealing under copyright law, you can submit a dispute directly in the app.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

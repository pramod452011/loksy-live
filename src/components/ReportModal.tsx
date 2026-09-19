import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, X, CheckCircle, AlertTriangle } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { reportModalData, closeReportModal, submitReport, blockUser } = useApp();
  const [selectedReason, setSelectedReason] = useState<string>('Spam or Scam');
  const [notes, setNotes] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);

  if (!reportModalData) return null;

  const reasons = [
    'Unlabeled AI / Deepfake',
    'Spam, Bot, or Scam',
    'Harassment or Hate Speech',
    'Misinformation / Fake News',
    'Graphic Violence or Harmful Content',
    'Nudity or Inappropriate Content',
    'Intellectual Property Violation',
    'Underage Safety Concern',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(selectedReason, notes);
    if (alsoBlock && reportModalData.targetType === 'user') {
      blockUser(reportModalData.targetId);
    }
  };

  return (
    <div
      id="loksy-report-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={closeReportModal}
    >
      <div
        className="w-full max-w-md bg-[#0F1423] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Report to LOKSY Safety</h3>
              <p className="text-xs text-gray-400 truncate max-w-[240px]">
                {reportModalData.nameOrTitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Why are you reporting this {reportModalData.targetType}?
            </label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  id={`report-reason-label-${reason.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-[#FF4668] bg-[#FF4668]/10 text-white font-semibold'
                      : 'border-white/5 bg-white/[0.02] text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {reason === 'Unlabeled AI / Deepfake' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span>{reason}</span>
                  </span>
                  <input
                    id={`report-reason-radio-${reason.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-[#FF4668]"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide any context that will help our safety moderators..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>

          {reportModalData.targetType === 'user' && (
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="accent-[#FF4668] rounded"
              />
              <span>Also block this user so they cannot see your profile or contact you</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-[#FF4668] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

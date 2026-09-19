import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Heart, Send, MessageCircle } from 'lucide-react';

export const CommentsModal: React.FC = () => {
  const {
    activeCommentPostId,
    setActiveCommentPostId,
    posts,
    reels,
    comments,
    addComment,
    toggleLikeComment,
    currentUser,
  } = useApp();

  const [commentText, setCommentText] = useState('');

  if (!activeCommentPostId) return null;

  const currentPost = posts.find(p => p.id === activeCommentPostId);
  const currentReel = reels.find(r => r.id === activeCommentPostId);
  const mediaItem = currentPost || currentReel;
  const postComments = comments[activeCommentPostId] || [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(activeCommentPostId, commentText);
    setCommentText('');
  };

  const quickEmojis = ['❤️', '🔥', '👏', '🙌', '✨', '😍', '☕', '🇮🇳'];

  return (
    <div
      id="loksy-comments-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setActiveCommentPostId(null)}
    >
      <div
        className="w-full max-w-lg bg-[#0F1423] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl h-[80vh] sm:h-[650px] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#FF8A00]" />
            <h3 className="font-bold text-white text-base">Comments ({postComments.length})</h3>
          </div>
          <button
            onClick={() => setActiveCommentPostId(null)}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post / Reel Summary Header */}
        {mediaItem && (
          <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex gap-3 items-start shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={mediaItem.user.avatar}
                alt={mediaItem.user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white mr-1.5">{mediaItem.user.name}</span>
              <span className="text-gray-300 line-clamp-2">{mediaItem.caption}</span>
              <span className="text-[10px] text-gray-500 block mt-1">{mediaItem.createdAt}</span>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {postComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageCircle className="w-10 h-10 text-gray-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-gray-300">No comments yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Start the conversation with {mediaItem?.user.name || 'creator'}!</p>
            </div>
          ) : (
            postComments.map((comment) => (
              <div key={comment.id} className="flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {comment.user.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {comment.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <button
                        onClick={() => setCommentText(`@${comment.user.username} `)}
                        className="hover:text-gray-300 font-medium"
                      >
                        Reply
                      </button>
                      {comment.likesCount > 0 && (
                        <span>{comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Like Heart */}
                <button
                  onClick={() => toggleLikeComment(activeCommentPostId, comment.id)}
                  className={`p-1 transition-transform active:scale-125 ${
                    comment.isLiked ? 'text-[#FF4668]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-[#FF4668]' : ''}`} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Bar: Emojis + Input */}
        <div className="p-3 bg-[#0B0F19] border-t border-white/5 shrink-0 space-y-2">
          {/* Quick emoji row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-0.5">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setCommentText((prev) => prev + emoji)}
                className="text-base p-1 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a polite comment... ✨"
              className="flex-1 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 rounded-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

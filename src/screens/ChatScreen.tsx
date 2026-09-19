import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Smile,
  CheckCheck,
  Search,
  MessageCircle,
  Sparkles,
  Phone,
  Video,
  Info,
} from 'lucide-react';

export const ChatScreen: React.FC = () => {
  const {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    sendMessage,
    currentUser,
    setViewingUserId,
    showToast,
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;
    sendMessage(activeChatId, messageInput);
    setMessageInput('');
  };

  const filteredChats = chats.filter(
    (c) =>
      c.participant.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div
      id="loksy-messages-screen"
      className="w-full max-w-4xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex bg-[#0B0F19] md:rounded-3xl border border-white/5 overflow-hidden shadow-2xl"
    >
      {/* Left Column: Conversation List (hidden on mobile if activeChat is open) */}
      <aside
        className={`w-full md:w-80 border-r border-white/5 flex flex-col shrink-0 ${
          activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
              <span>Direct Messages</span>
            </h2>
            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full font-semibold">
              {chats.length} active
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-white/10 border-l-2 border-[#00E5FF]' : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Avatar with online status */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <img
                      src={chat.participant.avatar}
                      alt={chat.participant.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {chat.participant.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white truncate">
                      {chat.participant.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {chat.lastMessage.createdAt}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">
                    {chat.lastMessage.isSenderMe && 'You: '}
                    {chat.lastMessage.text}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#00E5FF] text-[#070A12] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Column: Chat Window */}
      <div
        className={`flex-1 flex flex-col bg-[#070A12] ${
          !activeChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeChat ? (
          <>
            {/* Chat Top Bar */}
            <div className="p-3.5 bg-[#0B0F19] border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile Back button to list */}
                <button
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden p-1.5 rounded-xl text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => setViewingUserId(activeChat.participant.id)}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img
                      src={activeChat.participant.avatar}
                      alt={activeChat.participant.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {activeChat.participant.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070A12]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs sm:text-sm text-white group-hover:text-[#FF4668] transition-colors">
                        {activeChat.participant.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      {activeChat.participant.isOnline ? 'Active now' : activeChat.participant.lastSeen}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call / Info actions */}
              <div className="flex items-center gap-1 text-gray-400">
                <button
                  onClick={() => showToast('Audio call connecting... 📞')}
                  className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors"
                  title="Audio Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showToast('Video call connecting... 📹')}
                  className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingUserId(activeChat.participant.id)}
                  className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors"
                  title="View Profile"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Creator Intro Banner */}
              <div className="text-center py-6 border-b border-white/5 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border border-[#FF4668]/40">
                  <img
                    src={activeChat.participant.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="text-sm font-bold text-white">{activeChat.participant.name}</h4>
                <p className="text-xs text-gray-400">@{activeChat.participant.username} • LOKSY Creator</p>
                <p className="text-[11px] text-gray-500 mt-1">Direct messaging is protected & private</p>
              </div>

              {activeChat.messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white rounded-br-none shadow-md'
                          : 'bg-[#141B2D] text-gray-200 rounded-bl-none border border-white/5'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt=""
                          className="w-full rounded-xl mb-1.5 object-cover max-h-48"
                        />
                      )}
                      <p>{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 px-1">
                      <span>{msg.createdAt}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#00E5FF]" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-[#0B0F19] border-t border-white/5 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => showToast('Simulating photo attachment')}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                title="Send Photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message ${activeChat.participant.name.split(' ')[0]}...`}
                className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
              />

              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2.5 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#6366F1] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          /* Empty Chat State */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-8 h-8 text-[#00E5FF]" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Your Messages</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Select a conversation or visit a creator's profile to say Namaste and collaborate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

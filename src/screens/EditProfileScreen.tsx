import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, ArrowLeft, Check, Sparkles, User, AtSign, FileText, Globe, MapPin } from 'lucide-react';

export const EditProfileScreen: React.FC = () => {
  const { currentUser, updateProfile, goBack } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [website, setWebsite] = useState(currentUser.website || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  ];

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || currentUser.name,
      username: username.trim().toLowerCase().replace(/\s+/g, '_') || currentUser.username,
      bio: bio.trim(),
      website: website.trim(),
      location: location.trim(),
      avatar,
    });
  };

  return (
    <div id="loksy-edit-profile-screen" className="w-full max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <button
          onClick={goBack}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <h2 className="text-base font-bold text-white">Edit Profile</h2>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar change section */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#00E5FF]">
              <img
                src={avatar}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-[#070A12]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFile}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-[#FF8A00] hover:underline"
            >
              Change Photo
            </button>
            <div className="flex items-center gap-2 mt-2">
              {avatarPresets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setAvatar(preset)}
                  className={`w-7 h-7 rounded-full overflow-hidden border-2 cursor-pointer transition-transform ${
                    avatar === preset ? 'border-[#FF4668] scale-110' : 'border-white/20 hover:border-white/50'
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5 bg-[#0B0F19] p-5 rounded-3xl border border-white/5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-gray-400" /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" /> Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> Location (City / State)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New Delhi, India"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gray-400" /> Website Link
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://loksy.app/@yourname"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4668] via-[#FF8A00] to-[#E040FB] text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

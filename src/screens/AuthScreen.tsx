import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Check
} from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
}

type SignupStep = 1 | 2;

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'signup' }) => {
  const { login, signup, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Signup multi-step: Step 1 (Info) -> Step 2 (Profile Photo)
  const [signupStep, setSignupStep] = useState<SignupStep>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  // Step 2: Avatar & Profile Setup
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
  const [avatarPreview, setAvatarPreview] = useState<string>(defaultAvatar);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Validation
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Indian Creator Avatar Presets for 1-tap selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  ];

  // Auto-generate username suggestions when user types their name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    setError('');

    if (val.trim().length >= 2) {
      const baseSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      if (baseSlug) {
        const randNum = Math.floor(10 + Math.random() * 90);
        const suggestions = [
          baseSlug,
          `${baseSlug}_`,
          `${baseSlug}${randNum}`,
          `the_${baseSlug}`,
        ];
        setUsernameSuggestions(suggestions);
        if (!username || username === usernameSuggestions[0]) {
          setUsername(baseSlug);
        }
      }
    }
  };

  // Step 1 Submit: Validate account details and proceed to profile photo step
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name so friends can find you.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSignupStep(2);
  };

  // Step 2: Handle custom avatar file upload from device
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo file size is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setHasCustomAvatar(true);
        showToast('Photo selected! Looking great ✨');
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Finalize signup & immediately redirect to home feed
  const handleFinishSignup = (skipPhoto = false) => {
    setError('');
    setIsLoading(true);

    const finalAvatar = skipPhoto ? defaultAvatar : avatarPreview;
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    signup({
      name: fullName.trim(),
      username: cleanUsername,
      emailOrPhone: email.trim(),
      avatar: finalAvatar,
      password: password.trim(),
      bio: 'Indian creator on LOKSY 🇮🇳 | Apni Duniya, Apne Log',
    });
  };

  // Email / Username + Password Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = email.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setError('Please enter your email or @username.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      login(cleanIdentifier, cleanPassword);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In with Firebase GoogleAuthProvider
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    showToast('Connecting with Google Account...');

    try {
      const res = await signInWithGoogle();
      login(
        res.user.email || 'google_user@loksy.app',
        res.user.displayName || 'LOKSY Creator'
      );
      showToast(`Welcome back, ${res.user.displayName || 'Creator'}! ✨`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Tap Demo Login for instant testing
  const handleQuickDemoLogin = () => {
    login('aarav@loksy.app', 'Aarav Sharma');
  };

  return (
    <div
      id="loksy-auth-container"
      className="min-h-screen bg-[#070A12] text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans"
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#FF4668]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Instagram-Style Auth Card */}
      <div className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden aspect-square bg-[#070A12] border border-white/15 p-1 shadow-xl shadow-[#FF4668]/20 flex items-center justify-center">
            <img
              src="/loksy-logo.png"
              alt="LOKSY Official Logo"
              className="w-full h-full aspect-square object-contain drop-shadow-md"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('.png')) {
                  target.src = '/loksy-logo.svg';
                }
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-sans leading-none">
              LOK<span className="bg-gradient-to-r from-[#FF4668] to-[#FF9E00] bg-clip-text text-transparent">SY</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4668] animate-pulse" />
          </div>
          <span className="text-[11px] font-medium tracking-wide text-gray-400 mt-0.5">
            Apni Duniya, Apne Log 🇮🇳
          </span>
        </div>

        {/* Primary Tab Switcher: Log In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-2xl border border-white/10 mb-5">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            id="auth-tab-signup"
            onClick={() => {
              setMode('signup');
              setSignupStep(1);
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* ======================= LOG IN VIEW ==================== */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="auth-login-identifier"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="auth-login-submit-btn"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-lg shadow-[#FF4668]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#0B0F19] px-2 text-gray-500 font-semibold tracking-wider">
                  OR
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              id="auth-google-login-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2.5 hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quick 1-Tap Demo Login */}
            <button
              type="button"
              id="auth-demo-shortcut-btn"
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 rounded-xl bg-[#FF8A00]/10 border border-[#FF8A00]/25 text-[#FFA000] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#FF8A00]/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick 1-Tap Demo Login (Test User)</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ====================== SIGN UP VIEW ==================== */}
        {/* ======================================================== */}
        {mode === 'signup' && (
          <div>
            {/* Step 1: Account Details (Email, Name, Username, Password) */}
            {signupStep === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Sign up to see photos & reels
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Join LOKSY's creator community today
                  </p>
                </div>

                {/* Instant Google Sign-Up */}
                <button
                  type="button"
                  id="auth-google-signup-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2.5 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#0B0F19] px-2 text-gray-500 font-semibold tracking-wider">
                      OR WITH EMAIL
                    </span>
                  </div>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        id="auth-signup-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="auth-signup-name"
                        value={fullName}
                        onChange={handleNameChange}
                        placeholder="Aarav Sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="auth-signup-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="aarav_sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
                      />
                    </div>
                    {usernameSuggestions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[10px] text-gray-500">Suggestions:</span>
                        {usernameSuggestions.slice(0, 3).map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setUsername(sug)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                              username === sug
                                ? 'bg-[#FF4668]/20 border-[#FF4668] text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            @{sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="auth-signup-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="auth-signup-next-btn"
                    disabled={
                      isLoading ||
                      !email.trim() ||
                      !fullName.trim() ||
                      !username.trim() ||
                      password.length < 6
                    }
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF4668] via-[#FF8A00] to-[#FFA000] text-white text-xs font-bold shadow-lg shadow-[#FF4668]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-3"
                  >
                    <span>Next: Add Profile Photo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Add Profile Photo */}
            {signupStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep(1);
                      setError('');
                    }}
                    className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <span className="text-[11px] font-medium text-gray-400">Step 2 of 2</span>
                </div>

                <div className="text-center">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Add a profile photo
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Add a photo so your friends know it's you
                  </p>
                </div>

                {/* Avatar Preview */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#FF4668] shadow-xl shadow-[#FF4668]/20 bg-white/5">
                      <img
                        src={avatarPreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
                      title="Upload photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-xs text-[#FF8A00] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from device</span>
                  </button>

                  {/* Preset Avatars */}
                  <div className="flex items-center gap-2 pt-3">
                    <span className="text-[10px] text-gray-500">Or choose avatar:</span>
                    <div className="flex items-center gap-1.5">
                      {avatarPresets.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setAvatarPreview(preset);
                            setHasCustomAvatar(true);
                          }}
                          className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
                            avatarPreview === preset
                              ? 'border-[#FF4668] scale-110 ring-2 ring-[#FF4668]/30'
                              : 'border-white/20 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset}
                            alt={`Preset ${i + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Finish vs Skip */}
                <div className="space-y-2 pt-3">
                  <button
                    type="button"
                    id="auth-finish-signup-btn"
                    onClick={() => handleFinishSignup(false)}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF4668] via-[#FF8A00] to-[#E040FB] text-white text-xs font-bold shadow-lg shadow-[#FF4668]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Finish & Enter LOKSY</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="auth-skip-photo-btn"
                    onClick={() => handleFinishSignup(true)}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer: Switch between Login and Signup */}
        <div className="text-center mt-5 text-xs text-gray-400">
          {mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                id="toggle-to-login"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-[#FF8A00] font-bold hover:underline ml-1"
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                id="toggle-to-signup"
                onClick={() => {
                  setMode('signup');
                  setSignupStep(1);
                  setError('');
                }}
                className="text-[#FF8A00] font-bold hover:underline ml-1"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>

        {/* Security Badge Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Secured by Firebase Authentication & 256-Bit SSL</span>
        </div>
      </div>
    </div>
  );
};

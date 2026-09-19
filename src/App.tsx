import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';

// Modals
import { StoryViewerModal } from './components/StoryViewerModal';
import { CommentsModal } from './components/CommentsModal';
import { ShareModal } from './components/ShareModal';
import { ReportModal } from './components/ReportModal';
import { FollowListModal } from './screens/FollowListModal';
import { CreateModal } from './components/CreateModal';
import {
  CopyrightDetailsModal,
  CopyrightGuidelinesModal,
} from './components/CopyrightDetailsModal';

// Screens
import { LandingScreen } from './screens/LandingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ReelsScreen } from './screens/ReelsScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { ChatScreen } from './screens/ChatScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainLayout: React.FC = () => {
  const {
    currentScreen,
    isAuthenticated,
    toastMessage,
    copyrightModalClaim,
    copyrightModalTarget,
    closeCopyrightModal,
    disputeCopyrightClaim,
    replacePostAudio,
    isGuidelinesModalOpen,
    openGuidelinesModal,
    closeGuidelinesModal,
  } = useApp();

  // Gated Initial Screen: If no user session is active, the app must default directly to the Sign Up screen (with a toggle to Log In). No public feed access before authentication.
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen initialMode={currentScreen === 'login' ? 'login' : 'signup'} />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F1423] border border-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4668] animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'search':
        return <SearchScreen />;
      case 'reels':
        return <ReelsScreen />;
      case 'create':
        return <CreatePostScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'edit_profile':
        return <EditProfileScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const isReelOrChat = currentScreen === 'reels' || currentScreen === 'chat';

  return (
    <div id="loksy-app-root" className="min-h-screen bg-[#070A12] text-white flex flex-col md:flex-row antialiased selection:bg-[#FF4668] selection:text-white">
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 relative min-h-screen">
        {/* Top Header (visible on mobile, and standard on desktop) */}
        {!isReelOrChat && <Header />}

        {/* Dynamic Screen View */}
        <main
          className={`flex-1 overflow-x-hidden ${
            !isReelOrChat ? 'pb-20 md:pb-6' : 'pb-16 md:pb-0'
          }`}
        >
          {renderActiveScreen()}
        </main>

        {/* Mobile Persistent Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <StoryViewerModal />
      <CommentsModal />
      <ShareModal />
      <ReportModal />
      <FollowListModal />
      <CreateModal />
      <CopyrightDetailsModal
        isOpen={!!copyrightModalClaim}
        onClose={closeCopyrightModal}
        claim={copyrightModalClaim}
        target={copyrightModalTarget}
        onDispute={disputeCopyrightClaim}
        onReplaceAudio={replacePostAudio}
        onOpenGuidelines={openGuidelinesModal}
      />
      <CopyrightGuidelinesModal
        isOpen={isGuidelinesModalOpen}
        onClose={closeGuidelinesModal}
      />

      {/* Global Interactive Toast Alert */}
      {toastMessage && (
        <div
          id="loksy-global-toast"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F1423] border border-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF4668] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

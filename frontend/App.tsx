import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AuthPage from './pages/AuthPage';
import AdminUpload from './pages/AdminUpload';
import { Chat } from './types';

const Router: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#171717]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // ISPRAVLJENO: Provera uloge sada odgovara bazi ('Admin')
  if (currentHash === '#/admin') {
    if (user?.role?.toLowerCase() !== 'admin') {
      window.location.hash = '/';
      return null;
    }
    return <AdminUpload />;
  }

  return (
    <Layout
      sidebar={
        <Sidebar
          selectedChatId={selectedChat?.id}
          onSelectChat={setSelectedChat}
        />
      }
    >
      <ChatWindow chat={selectedChat} />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
};

export default App;
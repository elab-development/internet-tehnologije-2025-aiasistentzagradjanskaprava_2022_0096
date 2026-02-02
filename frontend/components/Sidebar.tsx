import React, { useEffect, useState } from 'react';
import { Plus, LogOut, ShieldCheck, MessageSquare, ChevronDown, ChevronRight, Folder as FolderIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Folder, Chat } from '../types';
import api from '../services/api';

interface SidebarProps {
  onSelectChat: (chat: Chat | null) => void;
  selectedChatId?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
  const { user, logout } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderChats, setFolderChats] = useState<{ [key: number]: Chat[] }>({});
  const [expandedFolders, setExpandedFolders] = useState<{ [key: number]: boolean }>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingChatInFolder, setCreatingChatInFolder] = useState<number | null>(null);
  const [newChatName, setNewChatName] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await api.get<Folder[]>('/api/folders/');
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders', error);
    }
  };

  const fetchChatsForFolder = async (folderId: number) => {
    try {
      const response = await api.get<Chat[]>(`/api/folders/${folderId}/chats/`);
      setFolderChats(prev => ({ ...prev, [folderId]: response.data }));
    } catch (error) {
      console.error('Error fetching chats', error);
    }
  };

  const toggleFolder = (folderId: number) => {
    const isExpanded = !!expandedFolders[folderId];
    setExpandedFolders(prev => ({ ...prev, [folderId]: !isExpanded }));
    if (!isExpanded && !folderChats[folderId]) {
      fetchChatsForFolder(folderId);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const response = await api.post<Folder>('/api/folders/', { name: newFolderName });
      setFolders([response.data, ...folders]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder', error);
    }
  };

  const handleCreateChat = async (e: React.FormEvent, folderId: number) => {
    e.preventDefault();
    if (!newChatName.trim()) return;
    try {
      const response = await api.post<Chat>('/api/chats/', { 
        name: newChatName, 
        folder_id: folderId 
      });
      setFolderChats(prev => ({
        ...prev,
        [folderId]: [response.data, ...(prev[folderId] || [])]
      }));
      setNewChatName('');
      setCreatingChatInFolder(null);
      setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
      onSelectChat(response.data);
      // Ako smo u admin panelu, vraćamo na home hash
      if (window.location.hash === '#/admin') {
        window.location.hash = '/';
      }
    } catch (error) {
      console.error('Error creating chat', error);
    }
  };

  return (
    <div className="w-72 bg-[#171717] text-white flex flex-col h-full border-r border-white/10">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h1 
          className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent cursor-pointer" 
          onClick={() => window.location.hash = '/'}
        >
          Legal AI
        </h1>
        
        {user?.role?.trim().toLowerCase() === 'admin' && (
          <a 
            href="#/admin" 
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-full transition-all"
            title="Admin Panel"
          >
            <ShieldCheck size={22} />
          </a>
        )}
      </div>

      <button
        onClick={() => setIsCreatingFolder(true)}
        className="mx-4 my-4 flex items-center gap-2 p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium bg-[#202123]"
      >
        <Plus size={18} />
        <span>Novi Folder</span>
      </button>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="px-2 mb-4">
            <input
              autoFocus
              className="w-full bg-[#202123] text-sm p-2 rounded border border-blue-500 outline-none"
              placeholder="Ime foldera..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => !newFolderName && setIsCreatingFolder(false)}
            />
          </form>
        )}

        <div className="space-y-1">
          {folders.map((folder) => (
            <div key={folder.id} className="space-y-1">
              <div className="group flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <button onClick={() => toggleFolder(folder.id)} className="p-1 hover:bg-white/10 rounded">
                  {expandedFolders[folder.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div 
                  className="flex-1 flex items-center gap-2 text-sm font-medium cursor-pointer truncate" 
                  onClick={() => toggleFolder(folder.id)}
                >
                  <FolderIcon size={16} className="text-blue-400 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingChatInFolder(folder.id);
                  }} 
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {expandedFolders[folder.id] && (
                <div className="ml-6 border-l border-white/10 pl-2 space-y-1">
                  {/* Input za kreiranje novog četa unutar foldera */}
                  {creatingChatInFolder === folder.id && (
                    <form onSubmit={(e) => handleCreateChat(e, folder.id)} className="pr-2 mb-2">
                      <input
                        autoFocus
                        className="w-full bg-[#202123] text-xs p-2 rounded border border-blue-400 outline-none"
                        placeholder="Ime razgovora..."
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        onBlur={() => !newChatName && setCreatingChatInFolder(null)}
                      />
                    </form>
                  )}

                  {folderChats[folder.id]?.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => onSelectChat(chat)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors truncate ${
                        selectedChatId === chat.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <span className="truncate">{chat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-[#171717]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
            {user?.username?.[0].toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm p-2 transition-colors"
        >
          <LogOut size={16} /> Odjavi se
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
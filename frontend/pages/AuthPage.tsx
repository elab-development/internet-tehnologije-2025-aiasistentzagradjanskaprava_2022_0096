
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AuthResponse } from '../types';
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login/' : '/api/register/';
      const response = await api.post<AuthResponse>(endpoint, formData);
      console.log("Response data sa backenda:", response.data);
      login(response.data);
      window.location.hash = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nešto je pošlo naopako. Proverite podatke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold">Pravni Asistent</h1>
          <p className="text-blue-100 text-sm mt-2">Pristupite digitalnoj bazi znanja</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}
          
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Korisničko ime"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email adresa"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Lozinka"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Prijavi se' : 'Registruj se')}
            <ArrowRight size={18} />
          </button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              {isLogin ? 'Nemate nalog? Registrujte se' : 'Već imate nalog? Prijavite se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

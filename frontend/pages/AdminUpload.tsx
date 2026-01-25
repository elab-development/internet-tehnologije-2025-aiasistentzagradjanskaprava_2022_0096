import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const AdminUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setStatus('error');
        setMessage('Dozvoljeni su samo PDF dokumenti.');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setStatus('idle');

    const formData = new FormData();
    // PROMENJENO: Ključ mora odgovarati polju u Serializeru (verovatno 'file_path' ili 'file')
    formData.append('file_path', file); 
    formData.append('title', file.name.replace('.pdf', ''));

    try {
      await api.post('/api/admin/upload/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
      });
      setStatus('success');
      setMessage('Dokument je uspešno otpremljen i procesiran.');
      setFile(null);
      // Reset inputa
      const input = document.getElementById('file-upload') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err: any) {
      console.error('Upload error details:', err.response?.data);
      setStatus('error');
      // Prikazujemo specifičnu grešku iz Django-a ako postoji (npr. "This field is required")
      const serverError = err.response?.data ? JSON.stringify(err.response.data) : '';
      setMessage(serverError || 'Došlo je do greške prilikom otpremanja.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="max-w-2xl mx-auto">
        <a href="#/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 transition-colors font-medium">
          <ArrowLeft size={18} /> Nazad na Chat
        </a>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Upload size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Upload</h1>
              <p className="text-gray-500 text-sm">Ažurirajte bazu znanja novim PDF propisima</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              file ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-300'
            }`}>
              <input
                type="file"
                accept=".pdf"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText size={48} className="text-indigo-500 mb-4" />
                    <span className="text-gray-900 font-medium truncate max-w-xs">{file.name}</span>
                    <span className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Upload size={24} className="text-gray-400" />
                    </div>
                    <span className="text-indigo-600 font-semibold">Kliknite da otpremite fajl</span>
                    <span className="text-gray-400 text-sm mt-2">Prevucite PDF dokument ovde</span>
                  </div>
                )}
              </label>
            </div>

            {status !== 'idle' && (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
                status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {status === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                <p className="text-sm font-medium leading-tight">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2 shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Procesiranje...
                </>
              ) : (
                'Započni otpremanje'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
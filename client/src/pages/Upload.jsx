import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, File, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { uploadResume } from '../services/api';
import { motion } from 'framer-motion';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { setUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }
    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    if (leetcodeUsername.trim()) {
      formData.append('leetcodeUsername', leetcodeUsername.trim());
    }

    try {
      const data = await uploadResume(formData);
      setUser(data.user);
      // Navigate to analysis page passing the user profile ID
      navigate(`/analysis/${data.user._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while uploading. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#030712] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
       {/* Abstract Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl shadow-2xl shadow-indigo-500/20">
           <File className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white mb-2">
          Upload your Resume
        </h2>
        <p className="text-center text-base text-slate-400">
          We&apos;ll automatically extract your skills and analyze your GitHub.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-black/50 sm:rounded-3xl sm:px-12 border border-slate-800">
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div 
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 transition-all duration-300 ease-out 
                ${dragActive ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center cursor-pointer">
                {file ? (
                  <motion.div 
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }} 
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
                      <File className="h-10 w-10 text-indigo-400" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-200">{file.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${dragActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                      <UploadIcon className="h-10 w-10" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col text-base leading-6 text-slate-300 items-center gap-1">
                      <p className="font-semibold text-indigo-400">Click to upload</p>
                      <p className="text-slate-500">or drag and drop</p>
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">PDF up to 5MB</p>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="application/pdf"
                      ref={fileInputRef}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="leetcodeUsername" className="block text-sm font-medium leading-6 text-slate-300">
                LeetCode Username (Required for Coding Rounds)
              </label>
              <div className="mt-2">
                <input
                  id="leetcodeUsername"
                  name="leetcodeUsername"
                  type="text"
                  required
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="e.g. lee215"
                  className="block w-full rounded-xl border-0 bg-white/5 py-3.5 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-slate-500 transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!file || !leetcodeUsername.trim() || loading}
                className={`relative flex w-full justify-center items-center gap-2 rounded-xl px-4 py-4 text-base font-semibold text-white shadow-lg sm:w-auto sm:px-10 transition-all duration-300 overflow-hidden
                  ${(!file || !leetcodeUsername.trim() || loading) ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/25 border border-indigo-500/50'}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-indigo-400" />
                    <span>Analyzing DNA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Initialize Interface</span>
                  </>
                )}
                {/* Shine effect */}
                {!loading && file && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;

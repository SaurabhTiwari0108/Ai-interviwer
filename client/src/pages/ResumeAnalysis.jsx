import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Github, Code, PlayCircle, Loader2, AlertCircle, ArrowRight, Server } from 'lucide-react';
import { getUserDashboard, initInterview } from '../services/api';
import { motion } from 'framer-motion';

const ResumeAnalysis = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We reuse the dashboard endpoint to get the user profile
        const { profile } = await getUserDashboard(userId);
        setProfile(profile);
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleStartInterview = async () => {
    try {
      setInitializing(true);
      const data = await initInterview();
      navigate(`/interview-hub/${data.interviewId}`);
    } catch (err) {
      setError('Failed to initialize interview sequence.');
      setInitializing(false);
    }
  };

  if (loading || initializing) {
    return (
      <div className="flex flex-col justify-center gap-4 items-center h-[calc(100vh-4rem)] bg-[#030712]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-indigo-400 font-medium animate-pulse">
          {initializing ? 'Initializing 5-Round Sequence...' : 'Extracting Profile Data...'}
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-[#030712] px-4 relative overflow-hidden">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-md w-full relative z-10">
          <AlertCircle className="w-14 h-14 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">System Error</h2>
          <p className="text-slate-400 mb-0">{error || "Profile parameters could not be established."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#030712] relative overflow-hidden text-slate-50 selection:bg-indigo-500/30">
      {/* Dynamic Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
              Profile Synthesis
            </h1>
            <p className="text-indigo-300 font-medium tracking-wide">Extracted DNA parameters verified. Ready for simulation.</p>
          </div>
          <button
            onClick={handleStartInterview}
            disabled={initializing}
            className="flex items-center justify-center gap-3 bg-indigo-600/80 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] border border-indigo-500/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initializing ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
            {initializing ? 'Generating Matrices...' : 'Initialize Interview Sequence'}
            {!initializing && <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] p-8 flex flex-col gap-8 h-fit hover:border-white/20 transition-all duration-500"
          >
            <div>
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Subject Designation</h3>
              <p className="text-3xl font-extrabold text-white">{profile.name || 'Unknown Entity'}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Extracted Core Competencies</h3>
              <div className="flex flex-wrap gap-2.5">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, i) => (
                    <motion.span 
                      key={skill} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + (i * 0.05) }}
                      className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-300 text-sm font-semibold rounded-lg border border-indigo-500/20 shadow-[0_0_10px_-2px_rgba(79,70,229,0.2)]"
                    >
                      {skill}
                    </motion.span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No valid parameters detected.</p>
                )}
              </div>
            </div>

            {profile.experience && profile.experience.length > 0 && (
              <div className="mt-2 text-sm text-slate-300">
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">Experience <Server className="w-3 h-3"/></h3>
                <ul className="list-disc pl-5 space-y-2">
                  {profile.experience.map((exp, i) => <li key={i}>{exp}</li>)}
                </ul>
              </div>
            )}
            
            {profile.education && profile.education.length > 0 && (
              <div className="mt-2 text-sm text-slate-300">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Education</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {profile.education.map((edu, i) => <li key={i}>{edu}</li>)}
                </ul>
              </div>
            )}

            <div>
               <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Codebase Locator</h3>
               <a 
                 href="https://github.com/SaurabhTiwari0108" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="flex items-center gap-3 mt-2 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_20px_-5px_rgba(79,70,229,0.3)] transition-all group duration-300"
               >
                 <Github className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                 <span className="text-white font-semibold">
                   @SaurabhTiwari0108
                 </span>
               </a>
            </div>
          </motion.div>

          {/* Extracted Projects Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] p-8 hover:border-white/20 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-5">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                 <Code className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Extracted Projects Array</h2>
            </div>

            {!profile.projects || profile.projects.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 font-medium text-lg">No projects detected in resume.</p>
                <p className="text-sm text-slate-500 mt-2">Questions will rely strongly on your core skills instead.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {profile.projects.map((proj, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="block p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/40 hover:shadow-[0_10px_30px_-5px_rgba(52,211,153,0.15)] transition-all group relative overflow-hidden duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start mb-3 gap-2">
                         <div className="mt-1 min-w-2 min-h-2 w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                         <p className="text-sm text-slate-300 line-clamp-4 leading-relaxed group-hover:text-slate-200 transition-colors">
                           {proj}
                         </p>
                      </div>
                      <div className="mt-auto pt-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-indigo-400/70 group-hover:text-emerald-400 transition-colors">
                        <span>Project Context</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;

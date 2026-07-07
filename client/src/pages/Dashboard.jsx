import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp, CheckCircle, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { getUserDashboard } from '../services/api';

import brainImg from '../assets/dashboard_brain_1776595237931.png';
import metricsImg from '../assets/dashboard_metrics_1776595253910.png';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId === 'demo') {
      setError('Please start an interview first to see your dashboard results.');
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const dashData = await getUserDashboard(userId);
        setData(dashData);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center flex-col gap-4 items-center h-[calc(100vh-4rem)] bg-[#050505]">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <p className="text-cyan-400 font-medium animate-pulse tracking-widest uppercase">Analyzing System Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] px-4 bg-[#050505] relative overflow-hidden">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md w-full relative z-10">
          <AlertCircle className="w-14 h-14 text-fuchsia-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-2 text-white">No Data Available</h2>
          <p className="text-gray-400 mb-8">{error || 'Dashboard data not found.'}</p>
          <Link to="/upload" className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)] transition-all">
            Initiate Neural Link
          </Link>
        </div>
      </div>
    );
  }

  const { profile, interviews } = data;
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  
  const latestInterview = completedInterviews.length > 0 ? completedInterviews[0] : null;

  let radarData = null;
  let barData = null;
  let allQuestions = [];
  let answers = [];

  if (latestInterview) {
    allQuestions = latestInterview.rounds.flatMap(r => r.questions || []);
    answers = allQuestions.filter(q => q.answer || q.feedback);

    if (answers.length > 0) {
      const categoriesSet = new Set();
      allQuestions.forEach(q => categoriesSet.add(q.category));
      const categories = Array.from(categoriesSet);

      const categoryScores = categories.map(cat => {
        const catAnswers = answers.filter(a => a.category === cat);
        if (catAnswers.length === 0) return 0;
        
        const sumTech = catAnswers.reduce((acc, a) => acc + (a.feedback?.technicalScore || 0), 0);
        return sumTech / catAnswers.length; 
      });

      radarData = {
        labels: categories,
        datasets: [
          {
            label: 'Vector Proficiency',
            data: categoryScores,
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            borderColor: 'rgba(6, 182, 212, 0.8)',
            pointBackgroundColor: 'rgba(217, 70, 239, 1)',
            borderWidth: 2,
          },
        ],
      };

      barData = {
        labels: answers.map((_, i) => `Node ${i + 1}`),
        datasets: [
          {
            label: 'Logic Score',
            data: answers.map(a => a.feedback?.technicalScore || 0),
            backgroundColor: 'rgba(6, 182, 212, 0.8)',
            borderRadius: 4,
          },
          {
            label: 'Clarity Rating',
            data: answers.map(a => a.feedback?.clarityScore || 0),
            backgroundColor: 'rgba(217, 70, 239, 0.8)',
            borderRadius: 4,
          }
        ]
      };
    }
  }

  const chartOptions = {
    color: '#e2e8f0',
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { min: 0, max: 10, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    },
    plugins: {
      legend: { labels: { color: '#e2e8f0' } }
    }
  };

  const radarOptions = {
    color: '#e2e8f0',
    scales: {
      r: { 
        min: 0, max: 10, 
        ticks: { stepSize: 2, color: '#94a3b8', backdropColor: 'transparent' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#e2e8f0', font: { size: 12 } }
      }
    },
    plugins: {
      legend: { labels: { color: '#e2e8f0' } }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050505] relative overflow-hidden text-gray-100 selection:bg-cyan-500/30">

      {/* Abstract Background Neons */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 tracking-tight mb-2 uppercase drop-shadow-sm">
              Nexus Dashboard
            </h1>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Agent {profile.name.split(' ')[0]} // Primary Cortex</p>
          </div>
          <div className="flex gap-3">
            <Link to="/upload" className="inline-flex justify-center items-center px-6 py-2.5 font-bold rounded-lg text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.8)] transition-all">
              Initialize New Scenario
            </Link>
          </div>
        </motion.div>

        {interviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 glass-panel rounded-2xl"
          >
            <TrendingUp className="mx-auto h-16 w-16 text-cyan-500 mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">No Telemetry Found</h3>
            <p className="text-gray-400">Upload candidate parameters to begin first simulation.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1 */}
            <div className="lg:col-span-1 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel shadow-2xl rounded-2xl p-8 relative overflow-hidden"
              >
                <div className="flex flex-col items-center mb-6 relative z-10">
                  <div className="w-20 h-20 rounded-2xl border border-cyan-500/50 bg-[#0a0a0a] flex items-center justify-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-white mb-4 shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)]">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'X'}
                  </div>
                  <h3 className="text-xl font-extrabold text-white text-center leading-tight mb-1">{profile?.name || 'Agent'}</h3>
                  <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Active Profile</p>
                </div>
                
                <div className="space-y-4 relative z-10">
                  {profile?.skills && profile.skills.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Neural Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-[#111] border border-white/10 rounded-md text-xs font-semibold text-gray-300">
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 8 && (
                          <span className="px-2 py-1 text-xs font-semibold text-fuchsia-500 flex items-center justify-center">
                            +{profile.skills.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                    {profile?.linkedinProfileUrl && (
                      <a href={profile.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-cyan-400 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-cyan-500 font-black group-hover:border-cyan-500/50 transition-colors">in</div>
                        <span className="truncate flex-1 font-medium">LinkedIn Uplink</span>
                      </a>
                    )}
                    {profile?.githubProfileUrl && (
                      <a href={profile.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-white font-black group-hover:border-white/50 transition-colors">gh</div>
                        <span className="truncate flex-1 font-medium">GitHub Uplink</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel shadow-2xl rounded-2xl p-8 relative overflow-hidden group"
              >
                 <img src={brainImg} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" alt="" />
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                   <div className="p-2 bg-[#111] border border-white/5 rounded-lg"><Zap className="w-4 h-4 text-fuchsia-400" /></div>
                   Latest Calibration
                 </h3>
                 {latestInterview ? (
                   <div className="flex flex-col items-center justify-center py-6 relative z-10">
                      <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-400 mb-2 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                        {latestInterview.overallScore || 'N/A'}<span className="text-3xl text-gray-500 font-bold">/10</span>
                      </div>
                      <p className="text-sm text-cyan-200/70 font-bold tracking-widest uppercase">System Viability</p>
                   </div>
                 ) : (
                   <p className="text-gray-500 italic relative z-10">Running initial diagnostics...</p>
                 )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel shadow-2xl rounded-2xl p-8 flex flex-col h-[350px]"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 shrink-0">
                  <div className="p-2 bg-[#111] border border-white/5 rounded-lg"><Clock className="w-4 h-4 text-gray-400" /></div>
                  Temporal History
                </h3>
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-grow">
                  {interviews.slice(0, 10).map((interview, i) => (
                    <motion.div 
                      key={interview._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-center justify-between border border-white/5 bg-[#111]/50 p-4 rounded-xl hover:bg-[#111] hover:border-cyan-500/30 transition-all cursor-default"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-200">
                          {new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className={`text-xs mt-1 uppercase tracking-wider font-bold ${interview.status === 'completed' ? 'text-cyan-400' : 'text-amber-400'}`}>Status: {interview.status}</p>
                      </div>
                      {interview.overallScore && (
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-[#0a0a0a] border border-white/10 shadow-inner">
                          <span className="text-white font-black text-lg">
                            {Math.round(interview.overallScore)}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Charts Area */}
            <div className="lg:col-span-2 space-y-8">
               {latestInterview && latestInterview.status === 'completed' && (
                 <>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="glass-panel shadow-2xl rounded-2xl p-8 relative overflow-hidden"
                    >
                      <img src={metricsImg} className="absolute top-0 right-0 w-1/2 h-full object-cover opacity-10 mix-blend-screen pointer-events-none" alt="" />
                      <h3 className="text-xl font-bold text-white mb-8 relative z-10">Data Node Distribution</h3>
                      <div className="h-[320px] w-full flex justify-center relative z-10">
                        {barData && <Bar data={barData} options={{ ...chartOptions, responsive: true, maintainAspectRatio: false }} />}
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[400px]">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel shadow-2xl rounded-2xl p-8 h-full"
                      >
                        <h3 className="text-xl font-bold text-white mb-6">Vector Radar</h3>
                        <div className="h-[260px] w-full flex justify-center">
                           {radarData && <Radar data={radarData} options={{ ...radarOptions, responsive: true, maintainAspectRatio: false }} />}
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel shadow-2xl rounded-2xl p-8 overflow-hidden flex flex-col h-full"
                      >
                        <h3 className="text-xl font-bold text-white mb-6 shrink-0">System Diagnostics Logs</h3>
                        <div className="space-y-4 overflow-y-auto flex-1 pr-3 custom-scrollbar">
                          {answers.map((ans, idx) => (
                             <div key={idx} className="bg-[#111] border border-white/5 p-4 rounded-xl shadow-inner">
                                <p className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest mb-2">Log_Entry_{idx + 1}</p>
                                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                  {ans.feedback?.improvementSuggestions || 'Optimal logic structure detected.'}
                                </p>
                             </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                 </>
               )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

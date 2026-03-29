import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, TrendingUp, CheckCircle, Clock } from 'lucide-react';
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
    // If it's a demo link, handle it gracefully
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
      <div className="flex justify-center flex-col gap-4 items-center h-[calc(100vh-4rem)] bg-[#030712]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-indigo-400 font-medium animate-pulse">Analyzing Performance Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] px-4 bg-[#030712] relative overflow-hidden">
        <div className="bg-slate-900/50 backdrop-blur-xl border flex flex-col items-center border-slate-800 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full relative z-10">
          <AlertCircle className="w-14 h-14 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">No Data Available</h2>
          <p className="text-slate-400 mb-8">{error || 'Dashboard data not found.'}</p>
          <Link to="/upload" className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all">
            Start New Interview
          </Link>
        </div>
      </div>
    );
  }

  const { profile, interviews } = data;
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  
  // Prepare data for the latest interview chart
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
        return sumTech / catAnswers.length; // Average tech score for category
      });

      radarData = {
        labels: categories,
        datasets: [
          {
            label: 'Technical Proficiency',
            data: categoryScores,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 0.8)',
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 2,
          },
        ],
      };

      // Data for Bar Chart (Tech vs Clarity for each question)
      barData = {
        labels: answers.map((_, i) => `Q${i + 1}`),
        datasets: [
          {
            label: 'Technical Score',
            data: answers.map(a => a.feedback?.technicalScore || 0),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 6,
          },
          {
            label: 'Clarity Score',
            data: answers.map(a => a.feedback?.clarityScore || 0),
            backgroundColor: 'rgba(217, 70, 239, 0.8)',
            borderRadius: 6,
          }
        ]
      };
    }
  }

  const chartOptions = {
    color: '#cbd5e1',
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { min: 0, max: 10, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    },
    plugins: {
      legend: { labels: { color: '#cbd5e1' } }
    }
  };

  const radarOptions = {
    color: '#cbd5e1',
    scales: {
      r: { 
        min: 0, max: 10, 
        ticks: { stepSize: 2, color: '#94a3b8', backdropColor: 'transparent' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#cbd5e1', font: { size: 12 } }
      }
    },
    plugins: {
      legend: { labels: { color: '#cbd5e1' } }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a] relative overflow-hidden text-slate-50 selection:bg-indigo-500/30">

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
              Performance Matrix
            </h1>
            <p className="text-slate-400 font-medium">Agent {profile.name.split(' ')[0]} // Analytics Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link to="/upload" className="inline-flex justify-center items-center px-6 py-2 border border-transparent font-semibold rounded text-white bg-[#2cbb5d] hover:bg-[#23994d] transition-colors">
              Initiate New Scenario
            </Link>
          </div>
        </motion.div>

        {interviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-[#1e1e1e] border border-slate-800 rounded-lg shadow-sm"
          >
            <TrendingUp className="mx-auto h-16 w-16 text-slate-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No data parameters found</h3>
            <p className="text-slate-400">Upload a resume to begin your first simulation.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Profile & Recent Performance Stats Summary */}
            <div className="lg:col-span-1 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#1e1e1e] rounded-lg shadow-sm border border-slate-800 p-8"
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-indigo-500/50 bg-slate-800 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)]">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <h3 className="text-xl font-bold text-white text-center leading-tight mb-1">{profile?.name || 'Agent'}</h3>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Candidate Profile</p>
                </div>
                
                <div className="space-y-4">
                  {profile?.skills && profile.skills.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Tech Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/50 rounded-lg text-xs font-medium text-slate-300">
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 8 && (
                          <span className="px-2 py-1 text-xs font-semibold text-slate-500 flex items-center justify-center">
                            +{profile.skills.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-3">
                    {profile?.linkedinProfileUrl && (
                      <a href={profile.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-300 hover:text-indigo-400 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 border border-[#0A66C2]/20 flex items-center justify-center text-[#0A66C2] font-black group-hover:bg-[#0A66C2]/20 transition-colors">in</div>
                        <span className="truncate flex-1 font-medium">LinkedIn Profile</span>
                      </a>
                    )}
                    {profile?.githubProfileUrl && (
                      <a href={profile.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-300 hover:text-slate-100 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black group-hover:bg-slate-700 transition-colors">gh</div>
                        <span className="truncate flex-1 font-medium">GitHub Profile</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1e1e1e] rounded-lg shadow-sm border border-slate-800 p-8 relative overflow-hidden group"
              >
                 <div className="absolute inset-0 bg-slate-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                   <div className="p-2 bg-[#2d2d2d] rounded"><CheckCircle className="w-4 h-4 text-[#2cbb5d]" /></div>
                   Latest Calibration
                 </h3>
                 {latestInterview ? (
                   <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-fuchsia-400 mb-2 drop-shadow-sm">
                        {latestInterview.overallScore || 'N/A'}<span className="text-3xl text-slate-600 font-bold">/10</span>
                      </div>
                      <p className="text-sm text-indigo-300/70 font-bold tracking-widest uppercase">Overall System Rating</p>
                   </div>
                 ) : (
                   <p className="text-slate-500 italic">Complete an interview to establish a baseline.</p>
                 )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1e1e1e] rounded-lg shadow-sm border border-slate-800 p-8"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-[#2d2d2d] rounded"><Clock className="w-4 h-4 text-slate-400" /></div>
                  Simulation History
                </h3>
                <div className="space-y-4">
                  {interviews.slice(0, 5).map((interview, i) => (
                    <motion.div 
                      key={interview._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-center justify-between border border-slate-800 bg-[#2d2d2d]/30 p-4 rounded-lg hover:bg-[#2d2d2d] hover:border-slate-700 transition-all cursor-default"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-indigo-400 mt-1 uppercase tracking-wider font-bold">Status: {interview.status}</p>
                      </div>
                      {interview.overallScore && (
                        <div className="relative flex items-center justify-center w-12 h-12 rounded bg-[#2d2d2d] border border-slate-700">
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
                      className="bg-[#1e1e1e] rounded-lg shadow-sm border border-slate-800 p-8"
                    >
                      <h3 className="text-xl font-bold text-white mb-8">Performance Distribution</h3>
                      <div className="h-[320px] w-full flex justify-center">
                        {barData && <Bar data={barData} options={{ ...chartOptions, responsive: true, maintainAspectRatio: false }} />}
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#1e1e1e] rounded-lg shadow-sm border border-slate-800 p-8"
                      >
                        <h3 className="text-xl font-bold text-white mb-6">Skill Vector Radar</h3>
                        <div className="h-[280px] w-full flex justify-center">
                           {radarData && <Radar data={radarData} options={{ ...radarOptions, responsive: true, maintainAspectRatio: false }} />}
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#1e1e1e] rounded-lg shadow-sm border border-slate-800 p-8 overflow-hidden flex flex-col"
                      >
                        <h3 className="text-xl font-bold text-white mb-6">AI Diagnostics Log</h3>
                        <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                          {answers.map((ans, idx) => (
                             <div key={idx} className="bg-[#2d2d2d] border border-slate-800 p-4 rounded-lg">
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Diagnostic_Q{idx + 1}</p>
                                <p className="text-sm text-slate-300 leading-relaxed">
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

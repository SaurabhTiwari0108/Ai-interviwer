import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Play, CheckCircle2, Lock, Clock, BrainCircuit, Terminal, Activity, FileText, Code2 } from 'lucide-react';
import { getInterviewStatus } from '../services/api';
import { motion } from 'framer-motion';

const ROUND_ICONS = {
  1: <Code2 className="w-6 h-6" />,
  2: <Activity className="w-6 h-6" />,
  3: <BrainCircuit className="w-6 h-6" />,
  4: <FileText className="w-6 h-6" />,
  5: <Terminal className="w-6 h-6" />
};

const ROUND_DURATIONS = {
  1: '120 min',
  2: '120 min',
  3: '15 min',
  4: '30 min',
  5: '120 min'
};

const InterviewHub = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const data = await getInterviewStatus(interviewId);
        setInterview(data);
      } catch (err) {
        setError('Failed to load interview sequence data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center gap-4 items-center h-[calc(100vh-4rem)] bg-[#030712]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-indigo-400 font-medium animate-pulse">Loading Phase Matrices...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-[#030712] px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full">
          <AlertCircle className="w-14 h-14 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sequence Error</h2>
          <p className="text-slate-400 text-center">{error || "Could not locate active sequence."}</p>
          <button 
             onClick={() => navigate('/')}
             className="mt-6 bg-red-500/20 hover:bg-red-500/30 text-red-100 font-semibold py-2 px-6 rounded-xl border border-red-500/50 transition-all"
          >
             Return to Base
          </button>
        </div>
      </div>
    );
  }

  const handleRoundAction = (roundNumber) => {
    navigate(`/interview/${interviewId}/round/${roundNumber}`);
  };

  const isInterviewComplete = interview.status === 'completed';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a] relative overflow-hidden text-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-4">
            Phase Hub
          </h1>
          <p className="text-slate-400 font-medium tracking-wide max-w-xl mx-auto">
            Complete the 5 structural assessment phases sequentially. Ensure you are in a quiet environment before initiating a sequence.
          </p>
          
          {isInterviewComplete && (
             <div className="mt-8 p-6 bg-[#1e1e1e] border border-[#2cbb5d]/50 rounded-lg max-w-md mx-auto relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-[shimmer_2s_infinite]" />
               <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
               <h3 className="text-xl font-bold text-[#2cbb5d] mb-1">Assessment Complete</h3>
               <p className="text-emerald-400/80 mb-4">Final Score: {interview.overallScore} / 10</p>
               <button 
                 onClick={() => navigate(`/interview/${interviewId}/feedback`)}
                 className="bg-[#2cbb5d] hover:bg-[#23994d] text-white px-6 py-2 rounded font-bold transition-transform hover:-translate-y-0.5"
               >
                 View Comprehensive Feedback Report
               </button>
             </div>
          )}
        </motion.div>

        <div className="flex flex-col gap-4">
          {interview.rounds.map((round, index) => {
            const isCompleted = round.status === 'completed';
            const isInProgress = round.status === 'in-progress';
            const isLocked = !isCompleted && !isInProgress && round.roundNumber > interview.currentRound;
            const isCurrent = round.roundNumber === interview.currentRound && !isInterviewComplete;
            
            return (
              <motion.div
                key={round.roundNumber}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-lg border relative overflow-hidden transition-all duration-300
                  ${isCompleted ? 'bg-[#1e1e1e] border-slate-800 opacity-60' : 
                    isCurrent ? 'bg-[#1e1e1e] border-[#2cbb5d]/50 shadow-[0_0_15px_-3px_rgba(44,187,93,0.15)] scale-[1.01]' : 
                    'bg-[#1e1e1e] border-slate-800 opacity-80'
                  }
                `}
              >
                {isCurrent && (
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-fuchsia-400" />
                )}

                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <div className={`p-4 rounded-md shrink-0 border
                    ${isCompleted ? 'bg-[#2d2d2d] border-[#2cbb5d]/30 text-[#2cbb5d]' :
                      isCurrent ? 'bg-[#2d2d2d] border-[#2cbb5d]/50 text-[#2cbb5d]' :
                      isLocked ? 'bg-[#1e1e1e] border-slate-800 text-slate-600' :
                      'bg-[#2d2d2d] border-slate-800 text-slate-400'
                    }
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : isLocked ? <Lock className="w-8 h-8" /> : ROUND_ICONS[round.roundNumber]}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Phase {round.roundNumber}</span>
                      {isInProgress && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase tracking-wider animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                    <h3 className={`text-xl font-bold ${isLocked ? 'text-slate-500' : 'text-slate-100'}`}>
                      {round.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                         <Clock className="w-4 h-4" />
                         {ROUND_DURATIONS[round.roundNumber]} Limit
                       </span>
                       {isCompleted && (
                         <span className="text-sm font-bold text-emerald-400">
                           Score: {round.score}
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto mt-4 sm:mt-0">
                  <button
                    onClick={() => handleRoundAction(round.roundNumber)}
                    disabled={isLocked || isCompleted}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded text-sm font-semibold transition-all duration-300
                      ${isCompleted ? 'bg-[#2d2d2d] border border-slate-800 text-slate-500 cursor-not-allowed' :
                        isLocked ? 'bg-[#1e1e1e] border border-slate-800 text-slate-600 cursor-not-allowed' :
                        isInProgress ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' :
                        'bg-[#2cbb5d] text-white hover:bg-[#23994d]'
                      }
                    `}
                  >
                    {!isCompleted && !isLocked && <Play className="w-5 h-5" />}
                    {isCompleted ? 'Archived' : isLocked ? 'Locked' : isInProgress ? 'Resume Phase' : 'Initiate Phase'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InterviewHub;

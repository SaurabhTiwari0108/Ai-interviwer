import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFinalFeedback } from '../services/api';
import { Loader2, AlertCircle, ArrowRight, Award, TrendingUp, TrendingDown, Target, Brain } from 'lucide-react';
import RobotInterviewer from '../components/RobotInterviewer';
import { motion } from 'framer-motion';

const FinalFeedback = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [robotSpeaking, setRobotSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const data = await getFinalFeedback(interviewId);
        setFeedback(data);
        
        // Prepare Speech
        const textToSpeak = `Hello! I have completed analyzing your interview performance. 
          Your main strengths are ${data.strengths.join(' and ')}. 
          Some areas to improve include ${data.weaknesses.join(' and ')}. 
          Overall, ${data.overallComments}. Thank you for taking the interview!`;
        
        setSpeechText(textToSpeak);
        
        // Start speaking after a short delay
        setTimeout(() => setRobotSpeaking(true), 1000);
        
      } catch (err) {
        setError('Failed to load the feedback report.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] bg-[#030712]">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-3 tracking-widest uppercase">Compiling Feedback Matrix</h2>
        <p className="text-slate-500">The AI is finalizing your evaluation...</p>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-[#030712] px-4">
        <div className="bg-slate-900 border border-red-500/30 p-8 rounded-xl max-w-md w-full text-center">
           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="mb-6 text-slate-300">{error}</p>
           <button onClick={() => navigate(`/interview-hub/${interviewId}`)} className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl border border-slate-700">Return to Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-slate-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row gap-8">
        
        {/* Left Col: Robot Interviewer */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
           <div className="sticky top-6">
              <RobotInterviewer 
                message={robotSpeaking ? speechText : "I have finished speaking."} 
                isSpeaking={robotSpeaking} 
                onSpeechEnd={() => setRobotSpeaking(false)} 
              />
              <button 
                onClick={() => setRobotSpeaking(!robotSpeaking)}
                className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
              >
                {robotSpeaking ? 'Stop Audio' : 'Replay Feedback Audio'}
              </button>
              
              <button 
                onClick={() => navigate(`/`)}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2"
              >
                Return Home <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Right Col: Feedback Cards */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
           
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#1e1e1e] border border-indigo-500/30 p-8 rounded-2xl shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 blur-[2px]"><Award className="w-32 h-32 text-indigo-500"/></div>
             <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
               <Brain className="w-4 h-4"/> AI Executive Summary
             </h2>
             <p className="text-xl md:text-2xl font-bold text-slate-200 leading-snug relative z-10">
               {feedback.overallComments}
             </p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-[#1e1e1e] border border-green-500/30 p-6 rounded-2xl">
                 <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5"/> Key Strengths
                 </h3>
                 <ul className="space-y-3">
                   {feedback.strengths?.map((str, i) => (
                     <li key={i} className="flex items-start gap-2 text-slate-300">
                       <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500"></span>
                       <span>{str}</span>
                     </li>
                   ))}
                 </ul>
              </motion.div>

              {/* Weaknesses */}
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-[#1e1e1e] border border-red-500/30 p-6 rounded-2xl">
                 <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5"/> Areas for Improvement
                 </h3>
                 <ul className="space-y-3">
                   {feedback.weaknesses?.map((wk, i) => (
                     <li key={i} className="flex items-start gap-2 text-slate-300">
                       <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-red-500"></span>
                       <span>{wk}</span>
                     </li>
                   ))}
                 </ul>
              </motion.div>
           </div>

           {/* Suggestions */}
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="bg-[#1e1e1e] border border-slate-700 p-8 rounded-2xl">
             <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5"/> Actionable Improvement Suggestions
             </h3>
             <div className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
               {feedback.improvementSuggestions}
             </div>
           </motion.div>

        </div>
      </div>
    </div>
  );
};

export default FinalFeedback;

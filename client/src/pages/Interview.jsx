import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ChevronRight, Mic, Send, Terminal, Clock, FileText, Play, CheckCircle2, XCircle } from 'lucide-react';
import { startRound, submitRoundAnswer, completeRound, runTestCases } from '../services/api';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RobotInterviewer from '../components/RobotInterviewer';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' }
];

const ROUND_DURATIONS_SECONDS = {
  1: 120 * 60, // 2 hours
  2: 120 * 60, // 2 hours
  3: 15 * 60,  // 15 mins
  4: 30 * 60,  // 30 mins
  5: 120 * 60  // 2 hours
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const Interview = () => {
  const { interviewId, roundNumber } = useParams();
  const navigate = useNavigate();
  const currentRoundNum = parseInt(roundNumber);
  
  const [round, setRound] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Track isolated answers globally across questions
  const [answersMap, setAnswersMap] = useState({}); // { [qId]: { code: '', voice: '' } }
  const [testResults, setTestResults] = useState({}); // { [qId]: { results: [], allPassed: boolean } }
  const [r3CodeSubmitted, setR3CodeSubmitted] = useState({}); // { [qId]: boolean }

  const [language, setLanguage] = useState('javascript');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [error, setError] = useState('');
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATIONS_SECONDS[currentRoundNum] || 3600);

  // Robot State
  const [robotMessage, setRobotMessage] = useState('');
  const [robotSpeaking, setRobotSpeaking] = useState(false);

  useEffect(() => {
    const initRound = async () => {
      try {
        setLoading(true);
        const data = await startRound(interviewId, currentRoundNum);
        setRound(data.round);
        
        const initialAnswers = {};
        const initialR3State = {};
        
        data.round.questions.forEach((q, idx) => {
           initialAnswers[q._id] = {
              code: q.codeAnswer || q.answer || '',
              voice: q.voiceAnswer || ''
           };
           // If they have code logic already, assume they locked it in Round 3
           if (currentRoundNum === 3 && (q.codeAnswer || q.answer)) {
              initialR3State[q._id] = true;
           }
        });
        setAnswersMap(initialAnswers);
        setR3CodeSubmitted(initialR3State);

        const firstUnanswered = data.round.questions.findIndex(q => !q.codeAnswer && !q.voiceAnswer && !q.answer);
        if (firstUnanswered !== -1) {
          setCurrentIdx(firstUnanswered);
        } else {
          setCurrentIdx(0);
        }
        
        if (data.round.startTime) {
           const elapsed = Math.floor((new Date() - new Date(data.round.startTime)) / 1000);
           const remaining = Math.max(0, ROUND_DURATIONS_SECONDS[currentRoundNum] - elapsed);
           setTimeLeft(remaining);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to initialize round. It might be already completed.');
      } finally {
        setLoading(false);
      }
    };

    initRound();
  }, [interviewId, currentRoundNum]);

  useEffect(() => {
    if (loading || timeLeft <= 0 || !round || round.status === 'completed') return;

    const timerObj = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerObj);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerObj);
  }, [loading, timeLeft, round]);

  const currentQuestion = round?.questions?.[currentIdx];

  useEffect(() => {
    if ([3, 4, 5].includes(currentRoundNum) && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
             finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript && currentQuestion?._id) {
           setAnswersMap(prev => {
             const prevVoice = prev[currentQuestion._id]?.voice || '';
             return {
               ...prev,
               [currentQuestion._id]: {
                 ...(prev[currentQuestion._id] || { code:'', voice:'' }),
                 voice: prevVoice + finalTranscript
               }
             };
           });
        }
      };

      recognitionRef.current.onerror = (event) => {
        // Only log actual errors, "no-speech" isn't a hard error but happens naturally
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error', event.error);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentRoundNum, currentQuestion?._id]);

  // Handle Robot speaking for different rounds
  useEffect(() => {
    if (currentRoundNum === 3 && r3CodeSubmitted[currentQuestion?._id] && !currentQuestion?.followUpQuestion) {
       setRobotMessage("I see you have submitted your code. Please explain what your solution does and how it works.");
       setRobotSpeaking(true);
    }
  }, [currentRoundNum, r3CodeSubmitted, currentQuestion]);

  useEffect(() => {
     if ([4, 5].includes(currentRoundNum) && currentQuestion) {
        setRobotMessage(currentQuestion.question);
        setRobotSpeaking(true);
     }
  }, [currentQuestion, currentRoundNum]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch(e) {
          console.error(e);
        }
      } else {
        alert("Speech Recognition is not supported in your browser.");
      }
    }
  };

  const handleTimeUp = async () => {
    try {
       setSubmitting(true);
       await completeRound(interviewId, currentRoundNum);
       navigate(`/interview-hub/${interviewId}`);
    } catch(err) {
       console.error(err);
    }
  };

  const updateAnswer = (field, value) => {
    if (!currentQuestion) return;
    setAnswersMap(prev => ({
      ...prev,
      [currentQuestion._id]: {
        ...(prev[currentQuestion._id] || { code:'', voice:'' }),
        [field]: value
      }
    }));
  };

  const handleRunTests = async () => {
    if (!currentQuestion) return;
    try {
      setRunningTests(true);
      const code = answersMap[currentQuestion._id]?.code || '';
      const res = await runTestCases(interviewId, currentRoundNum, currentQuestion._id, code);
      setTestResults(prev => ({
         ...prev,
         [currentQuestion._id]: res
      }));
    } catch(err) {
      console.error("Test cases failed to compile.");
    } finally {
      setRunningTests(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!currentQuestion) return;

    const curAns = answersMap[currentQuestion._id] || { code: '', voice: '' };
    
    // Validate Round 3 Logic completely
    if (currentRoundNum === 3) {
      if (!r3CodeSubmitted[currentQuestion._id]) {
        // Lock code, transition to voice phase
        setR3CodeSubmitted(prev => ({ ...prev, [currentQuestion._id]: true }));
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');
      
      const res = await submitRoundAnswer(interviewId, currentRoundNum, currentQuestion._id, curAns.code, curAns.voice, language);
      
      if (res.isFollowUp) {
        setRobotMessage(res.followUpQuestion);
        setRobotSpeaking(true);
        // Reset voice map so they can record second answer
        updateAnswer('voice', '');
        
        // Update local round
        setRound(prev => {
           const newQs = [...prev.questions];
           newQs[currentIdx].followUpQuestion = res.followUpQuestion;
           return { ...prev, questions: newQs };
        });
        setSubmitting(false);
        return;
      }
      
      if (currentIdx < round.questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
         await completeRound(interviewId, currentRoundNum);
         navigate(`/interview-hub/${interviewId}`);
      }
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] bg-[#030712] relative overflow-hidden">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-3">Initializing Phase {currentRoundNum}</h2>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-[#030712] px-4">
        <div className="bg-slate-900 border border-red-500/30 p-8 rounded-xl max-w-md w-full">
           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="mb-6 text-slate-300 text-center">{error}</p>
           <button onClick={() => navigate(`/interview-hub/${interviewId}`)} className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl border border-slate-700">Return</button>
        </div>
      </div>
    );
  }

  const curState = answersMap[currentQuestion?._id] || { code:'', voice:'' };
  const curTests = testResults[currentQuestion?._id];
  const isCodeLocked = currentRoundNum === 3 && r3CodeSubmitted[currentQuestion?._id];

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-[#0a0a0a] text-slate-300 p-2 flex flex-col font-sans">
      
      <div className="flex items-center justify-between px-2 mb-2 shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-[#1e1e1e] border border-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-400">
             Phase {currentRoundNum}: {round.title}
           </div>
           
           {/* Question Nav / Tabs for Round 1 */}
           {currentRoundNum === 1 ? (
             <div className="flex gap-1">
               {round.questions.map((q, idx) => (
                 <button 
                   key={idx} 
                   onClick={() => setCurrentIdx(idx)}
                   className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentIdx === idx ? 'bg-indigo-600 text-white' : 'bg-[#1e1e1e] text-slate-400 hover:bg-slate-800'}`}
                 >
                   Question {idx + 1}
                 </button>
               ))}
             </div>
           ) : (
             <div className="bg-[#1e1e1e] border border-slate-800 px-3 py-1 rounded text-xs font-semibold text-slate-300">
               Question {currentIdx + 1} of {round.questions.length}
             </div>
           )}
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded border text-sm font-mono font-bold
            ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#1e1e1e] border-slate-800 text-slate-300'}
        `}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-2 flex-grow overflow-hidden">
        
        {/* Description Pane */}
        <div className={`w-full ${[4, 5].includes(currentRoundNum) ? 'lg:w-[60%]' : 'lg:w-[45%]'} bg-[#1e1e1e] rounded-lg border border-slate-800 flex flex-col overflow-hidden`}>
          <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-slate-800 shrink-0">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Description</span>
          </div>
          <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert max-w-none prose-pre:bg-[#2d2d2d] prose-pre:border-slate-800 text-slate-300 text-sm leading-relaxed prose-img:rounded-md prose-img:border prose-img:border-slate-800 prose-img:shadow-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentQuestion?.question}
              </ReactMarkdown>
              
              {([3, 4, 5].includes(currentRoundNum)) && (
                <div className="mt-8">
                  {currentRoundNum === 3 && currentQuestion?.followUpQuestion && (
                    <div className="mb-4 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-md">
                      <h4 className="text-indigo-400 font-bold mb-1 uppercase text-xs">Follow-up Question:</h4>
                      <p className="text-slate-300 font-semibold">{currentQuestion.followUpQuestion}</p>
                    </div>
                  )}
                  <h4 className="text-indigo-400 font-bold mb-2 uppercase text-xs">Verbal Transcript:</h4>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-md min-h-[100px]">
                     {curState.voice ? curState.voice : <span className="text-slate-600 italic">No verbal explanation recorded yet...</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interaction Pane */}
        {![4, 5].includes(currentRoundNum) && (
          <div className="w-full lg:w-[55%] flex flex-col gap-2 overflow-hidden">
            
            <div className="bg-[#1e1e1e] rounded-lg border border-slate-800 flex flex-col overflow-hidden flex-grow relative">
              
              {currentRoundNum === 3 && isCodeLocked && (
                 <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6">
                    <RobotInterviewer message={robotMessage} isSpeaking={robotSpeaking} onSpeechEnd={() => setRobotSpeaking(false)} />
                    <div className="bg-slate-800 mt-6 px-6 py-3 rounded-full border border-slate-700 text-slate-300 font-bold flex items-center gap-2 shadow-xl">
                      Code Locked. Please activate microphone to explain your logic.
                    </div>
                 </div>
              )}

              <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                   {[1, 3].includes(currentRoundNum) ? (
                     <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-transparent text-slate-300 text-xs font-semibold focus:ring-0 cursor-pointer">
                       {LANGUAGES.map(lang => (<option key={lang.value} value={lang.value} className="bg-[#2d2d2d]">{lang.label}</option>))}
                     </select>
                   ) : (
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terminal</span>
                   )}
                </div>

                {/* Round 3 Mic Toggle */}
                {currentRoundNum === 3 && (
                  <button
                    onClick={toggleRecording}
                    disabled={!isCodeLocked}
                    className={`text-xs px-3 py-1 rounded transition-colors flex items-center gap-2 font-bold z-20 pointer-events-auto
                        ${!isCodeLocked ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' :
                           isRecording ? 'bg-red-500/20 text-red-500 box-shadow-pulse' : 'bg-indigo-600 text-white'}`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {isRecording ? 'Recording Explanation...' : 'Activate Microphone'}
                  </button>
                )}
              </div>
              
              <div className="flex-grow flex flex-col relative h-full">
                {currentRoundNum === 2 && currentQuestion?.options ? (
                  <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col gap-3">
                    <h3 className="text-slate-300 font-bold mb-2">Select the correct option:</h3>
                    {currentQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => updateAnswer('code', opt)}
                        className={`text-left w-full p-4 rounded border transition-all flex items-center ${
                           curState.code === opt 
                           ? 'bg-[#2cbb5d]/10 border-[#2cbb5d] text-white' 
                           : 'bg-[#2d2d2d] border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="font-black w-8 shrink-0">{String.fromCharCode(65 + i)}.</span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex-grow overflow-hidden">
                    <Editor
                      height="100%"
                      language={language}
                      theme="vs-dark"
                      value={curState.code}
                      onChange={(val) => updateAnswer('code', val || '')}
                      options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "monospace", padding: { top: 16 } }}
                    />
                  </div>
                )}
                
                {/* Test Cases Pane (Round 1 Only) */}
                {currentRoundNum === 1 && (
                  <div className="h-1/3 min-h-[150px] bg-[#1a1a1a] border-t border-slate-800 flex flex-col shrink-0">
                    <div className="h-8 bg-[#222] border-b border-slate-800 flex items-center justify-between px-4">
                      <span className="text-xs font-bold text-slate-400 uppercase">Test Cases</span>
                      {curTests?.message && (
                        <span className={`text-xs font-bold ${curTests.allPassed ? 'text-green-500' : 'text-amber-500'}`}>{curTests.message}</span>
                      )}
                    </div>
                    <div className="flex-grow p-3 overflow-y-auto space-y-2 custom-scrollbar">
                      {curTests ? (
                        curTests.results?.map((res, i) => (
                           <div key={i} className={`p-3 rounded border text-sm font-mono ${res.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {res.passed ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                                <span className={`font-bold ${res.passed ? 'text-green-400' : 'text-red-400'}`}>Test Case {i+1}</span>
                              </div>
                              <div className="text-slate-400 mt-2 text-xs">Input: <span className="text-slate-300">{res.input}</span></div>
                              <div className="text-slate-400 text-xs">Expected: <span className="text-slate-300">{res.expected}</span></div>
                              <div className="text-slate-400 text-xs">Actual: <span className="text-slate-300">{res.actual}</span></div>
                           </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">Run code to see test case output</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
            </div>

            {/* Sub-Footer Logic */}
            <div className="h-[52px] bg-[#1e1e1e] rounded-lg border border-slate-800 flex items-center justify-between px-4 shrink-0 shadow-sm">
               <button onClick={() => navigate(`/interview-hub/${interviewId}`)} className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1 transition-colors" disabled={submitting}>Pause Session</button>
               
               <div className="flex items-center gap-3">
                 {currentRoundNum === 1 && (
                   <button 
                     onClick={handleRunTests}
                     disabled={runningTests || !curState.code.trim()}
                     className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-4 py-1.5 rounded flex items-center gap-2"
                   >
                     {runningTests ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />} Run Code
                   </button>
                 )}

                 <button
                   onClick={handleSubmit}
                   disabled={submitting}
                   className="bg-[#2cbb5d] text-white hover:bg-[#23994d] text-sm font-bold px-6 py-1.5 rounded flex items-center gap-2"
                 >
                   {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     currentRoundNum === 3 && !isCodeLocked ? 'Submit Code Logic' : 
                     (currentIdx < round.questions.length - 1 ? 'Next Question' : 'Submit Answers')
                   }
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Action Footer/Media Pane for Rounds 4 & 5 (Voice Only) */}
        {[4, 5].includes(currentRoundNum) && (
          <div className="w-full lg:w-[40%] flex flex-col gap-4 overflow-hidden relative">
             {/* Robot Interviewer */}
             <div className="bg-[#1e1e1e] rounded-lg border border-slate-800 p-6 flex flex-col items-center justify-center flex-shrink-0">
                <RobotInterviewer message={robotMessage} isSpeaking={robotSpeaking} onSpeechEnd={() => setRobotSpeaking(false)} />
             </div>
             
             {/* Camera (Round 4) */}
             {currentRoundNum === 4 && (
                <div className="bg-black rounded-lg border border-slate-800 overflow-hidden flex-grow flex items-center justify-center relative">
                   <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                   <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest text-slate-300 border border-slate-700 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                   </div>
                </div>
             )}
             
             <div className="mt-auto bg-[#1e1e1e] p-4 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-3">
               <button
                  onClick={toggleRecording}
                  className={`flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg ${
                     isRecording ? 'bg-red-500 text-white cursor-pointer box-shadow-pulse hover:bg-red-600' : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
               >
                  <Mic className="w-5 h-5"/> {isRecording ? 'Evaluating frequency...' : 'Tap To Speak'}
               </button>

               <button
                 onClick={handleSubmit}
                 disabled={submitting || !curState.voice.trim()}
                 className={`flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all ${
                    curState.voice.trim() ? 'bg-[#2cbb5d] text-white hover:bg-[#23994d] cursor-pointer shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                 }`}
               >
                 {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5"/> Submit Transmission</>}
               </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Interview;

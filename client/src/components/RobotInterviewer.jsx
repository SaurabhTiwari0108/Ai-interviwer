import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const RobotInterviewer = ({ message, isSpeaking, onSpeechEnd }) => {
  const [showText, setShowText] = useState('');
  const onSpeechEndRef = useRef(onSpeechEnd);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  useEffect(() => {
    let utterance;
    if (message && isSpeaking) {
      setShowText(message);
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      utterance = new SpeechSynthesisUtterance(message);
      
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Microsoft Zira') || v.name.includes('Samantha') || v.lang === 'en-US');
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.1;

      utterance.onend = () => {
        if (onSpeechEndRef.current) onSpeechEndRef.current();
      };
      
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [message, isSpeaking]);

  // Ensure voices are loaded (Chrome sometimes needs this)
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl">
      <motion.div 
        animate={{ 
          y: isSpeaking ? [0, -10, 0] : 0,
          scale: isSpeaking ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          duration: 1.5, 
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {/* Glow behind bot */}
        <div className={`absolute inset-0 rounded-full blur-xl ${isSpeaking ? 'bg-indigo-500/40 animate-pulse' : 'bg-slate-500/20'}`} />
        
        <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-4 ${isSpeaking ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-700 border-slate-600'}`}>
           <Bot className={`w-12 h-12 ${isSpeaking ? 'text-white' : 'text-slate-400'}`} />
        </div>
      </motion.div>
      
      {showText && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-sm text-center"
        >
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium leading-relaxed shadow-inner">
             {showText}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RobotInterviewer;

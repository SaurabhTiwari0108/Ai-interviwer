import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, FileText, Code2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    name: 'Resume Intelligence',
    description: 'Our AI instantly extracts your skills, experience, and timeline from your PDF to tailor every question perfectly to your background.',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'GitHub Analysis',
    description: 'We scan your public repositories to understand your actual coding practices and ask context-aware technical questions.',
    icon: Code2,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Real-time Evaluation',
    description: 'Get instant, deeply technical feedback from Gemini AI. We analyze clarity, accuracy, and structural completeness.',
    icon: BrainCircuit,
    color: 'from-fuchsia-500 to-pink-500',
  },
];

const Landing = () => {
  return (
    <div className="bg-[#030712] min-h-screen text-slate-50 overflow-hidden relative selection:bg-indigo-500/30">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-20 lg:px-8">
        <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-48 flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-300 mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Powered by Google Gemini Pro</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-8"
          >
            Nail your next tech interview with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">
              precision AI
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg leading-relaxed text-slate-400 max-w-2xl"
          >
            Upload your resume and get hyper-personalized technical interview questions based on your unique skills and actual GitHub projects. Practice in a stress-free environment.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 flex items-center justify-center gap-x-6"
          >
            <Link
              to="/upload"
              className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              Start Free Interview
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Feature Section with Glassmorphism */}
      <div className="py-24 sm:py-32 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl lg:text-center text-center"
          >
            <h2 className="text-base font-semibold leading-7 text-indigo-400 tracking-wide uppercase">Core Infrastructure</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to succeed
            </p>
          </motion.div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, idx) => (
                <motion.div 
                  key={feature.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2, duration: 0.5 }}
                  className="flex flex-col bg-slate-900/50 backdrop-blur-lg border border-slate-800 rounded-3xl p-8 hover:bg-slate-800/50 transition-colors"
                >
                  <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-white mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-relaxed text-slate-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

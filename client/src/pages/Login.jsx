import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain, Loader2, AlertCircle } from 'lucide-react';
import loginBg from '../assets/login_bg_1776595217609.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/upload';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
       setError(err.response?.data?.error || 'Failed to connect. Please try again.');
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-4rem)] bg-cover bg-center flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-sm z-0"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center relative z-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_-10px_rgba(6,182,212,0.8)] mb-6 border border-white/20">
           <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">
          System Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Unregistered Agent?{' '}
          <Link to="/register" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors drop-shadow-md">
            Initialize Profile
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel py-8 px-4 sm:rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Network ID (Email)
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl bg-[#0a0a0a]/80 border border-white/10 py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
                  placeholder="agent@matrix.net"
                />
              </div>
            </div>

            <div>
               <label htmlFor="password" className="block text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Security Key
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl bg-[#0a0a0a]/80 border border-white/10 py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)] focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-70 transition-all transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Authenticating...
                  </>
                ) : (
                  'Engage'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;


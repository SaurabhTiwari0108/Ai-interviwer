import { Link, useNavigate } from 'react-router-dom';
import { Brain, User as UserIcon, LogOut } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
                 <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">AI Interviewer</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
               <>
                 <Link to="/upload" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                   New Interview
                 </Link>
                 <Link to={`/dashboard/${user._id}`} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                   <UserIcon className="h-4 w-4" />
                   <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                 </Link>
                 <button onClick={handleLogout} className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors" title="Log out">
                   <LogOut className="h-5 w-5" />
                 </button>
               </>
            ) : (
               <>
                 <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                   Log in
                 </Link>
                 <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95">
                   Sign up
                 </Link>
               </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

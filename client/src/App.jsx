import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import ResumeAnalysis from './pages/ResumeAnalysis';
import InterviewHub from './pages/InterviewHub';
import Interview from './pages/Interview';
import Dashboard from './pages/Dashboard';
import FinalFeedback from './pages/FinalFeedback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/upload" element={ <ProtectedRoute><Upload /></ProtectedRoute> } />
              <Route path="/analysis/:userId" element={ <ProtectedRoute><ResumeAnalysis /></ProtectedRoute> } />
              <Route path="/interview-hub/:interviewId" element={ <ProtectedRoute><InterviewHub /></ProtectedRoute> } />
              <Route path="/interview/:interviewId/round/:roundNumber" element={ <ProtectedRoute><Interview /></ProtectedRoute> } />
              <Route path="/dashboard/:userId" element={ <ProtectedRoute><Dashboard /></ProtectedRoute> } />
              <Route path="/interview/:interviewId/feedback" element={ <ProtectedRoute><FinalFeedback /></ProtectedRoute> } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

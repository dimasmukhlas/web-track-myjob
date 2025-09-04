import { useAuth } from '@/hooks/useFirebaseAuth';
import { JobApplicationsList } from '@/components/JobApplicationsList';
import { Button } from '@/components/ui/button';
import { LogOut, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DebugUserInfo } from '@/components/DebugUserInfo';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="text-center space-y-8 max-w-md apple-fade-in">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold apple-heading text-gray-900">TrackJob</h1>
            <p className="text-xl apple-text text-gray-600 leading-relaxed">
              Organize your job search journey with beautiful simplicity
            </p>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="w-full h-14 apple-button bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg rounded-2xl shadow-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="glass border-b border-white/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold apple-heading text-gray-900">TrackJob</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Welcome back</p>
              <p className="text-xs text-gray-500 truncate max-w-32">{user.email}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="apple-button border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        {/* Temporary debug component - remove after migration */}
        <div className="mb-8">
          <DebugUserInfo />
        </div>
        <div className="apple-slide-up">
          <JobApplicationsList />
        </div>
      </main>
    </div>
  );
};

export default Index;

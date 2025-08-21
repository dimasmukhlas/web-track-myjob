import { useAuth } from '@/hooks/useAuth';
import { JobApplicationsList } from '@/components/JobApplicationsList';
import { Button } from '@/components/ui/button';
import { LogOut, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <Briefcase className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">TrackJob</h1>
          <p className="text-xl text-muted-foreground">
            Track and manage your job applications with ease
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">TrackJob</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <JobApplicationsList />
      </main>
    </div>
  );
};

export default Index;

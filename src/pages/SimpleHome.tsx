import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SimpleHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-10 bg-background/80 backdrop-blur-sm border-b">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              Ledgr
            </Link>
            <div className="space-x-4">
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-6xl font-bold mb-6">
            Modern Invoice Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your accounting workflow with intelligent invoice generation, 
            automated tracking, and seamless payment processing.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleHome;
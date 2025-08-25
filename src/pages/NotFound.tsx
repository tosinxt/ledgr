import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl font-bold text-blue-600 mb-2">404</div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Page not found</h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Go Home</Link>
          <Link to="/dashboard" className="px-4 py-2 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

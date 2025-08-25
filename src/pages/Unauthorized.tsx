import React from 'react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Unauthorized</div>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Your session may have expired or you don't have access to this page.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Log in</a>
          <a href="/" className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">Go Home</a>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.name}!
          </h1>
          
          <div className="mb-8">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Invoices</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Amount</h3>
              <p className="text-3xl font-bold text-green-600">$0.00</p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">0</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/create-invoice"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Your First Invoice
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>
                You're on the <strong>{user?.plan === 'free' ? 'Free' : 'Pro'}</strong> plan.
                {user?.plan === 'free' && (
                  <span>
                    {' '}
                    <Link to="/upgrade" className="text-blue-600 hover:text-blue-500">
                      Upgrade to Pro
                    </Link>
                    {' '}for unlimited invoices and advanced features.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
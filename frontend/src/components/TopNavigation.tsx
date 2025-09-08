import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChartViewToggle from './ChartViewToggle';

interface TopNavigationProps {
  currentView: 'single' | 'multi';
  onViewChange: (view: 'single' | 'multi') => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ currentView, onViewChange }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const handleBacktest = () => {
    navigate('/backtest');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <nav className="bg-white shadow">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Trading Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <ChartViewToggle 
              currentView={currentView}
              onViewChange={onViewChange}
            />
            
            {isAuthenticated ? (
              // Authenticated user buttons
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleBacktest}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Backtest
                </button>
                <button 
                  onClick={handleSettings}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              // Guest user buttons
              <div className="flex items-center gap-3">
                <Link 
                  to="/login"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigation } from './Navigation';

const Layout=({ children })=> {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {currentUser && <Navigation />}
      <div className="max-w-12xl mx-auto">
        {children}
      </div>
    </div>
  );
}
export default Layout;
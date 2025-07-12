import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import NotificationSystem from '../UI/NotificationSystem';

const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
      
      <NotificationSystem />
    </div>
  );
};

export default Layout;
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { UserCircle } from 'lucide-react'; // Import a user icon
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      {/* Add relative positioning to main for absolute positioning of the icon */}
      <main className="flex-1 p-6 overflow-y-auto relative">
        {/* Profile Icon Link to Admin Page */}
        <div className="absolute top-6 right-6">
          <Link 
            to="/admin" 
            className="text-text-secondary hover:text-primary transition-colors duration-200" 
            title="Admin Page"
          >
            <UserCircle size={32} /> {/* Adjust size as needed */}
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;


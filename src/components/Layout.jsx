import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { UserCircle } from 'lucide-react'; // Import a user icon
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    // Use the primary background color defined in the theme (lightest green)
    <div className="flex h-screen bg-[--color-background]">
      <Sidebar />
      {/* Add relative positioning to main for absolute positioning of the icon */}
      <main className="flex-1 p-6 overflow-y-auto relative">
        {/* Profile Icon Link to Admin Page */}
        <div className="absolute top-6 right-6">
          <Link 
            to="/admin" 
            className="text-[--color-text-secondary] hover:text-[--color-primary-dark] transition-colors duration-200" 
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


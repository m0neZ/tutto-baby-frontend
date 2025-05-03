import React from 'react';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar'; // Will be refactored to use MUI Drawer

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar /> {/* Sidebar will contain the MUI Drawer */}
      
      {/* Main content area */}
      <Box 
        component="main" 
        sx={{
          flexGrow: 1, 
          p: 3, // Padding around the main content
          overflowY: 'auto', // Allow scrolling within the main content area
          position: 'relative' // Keep relative positioning if needed for other elements
        }}
      >
        {/* Profile Icon Button REMOVED */}
        
        {/* Render the page content passed as children */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;


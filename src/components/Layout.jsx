import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
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
          position: 'relative' // For positioning the icon button
        }}
      >
        {/* Profile Icon Button linking to Admin Page */}
        <IconButton
          component={RouterLink}
          to="/admin"
          title="Admin Page"
          sx={{
            position: 'absolute',
            top: 16, // Adjust spacing as needed (theme.spacing(2))
            right: 16, // Adjust spacing as needed (theme.spacing(2))
            color: 'text.secondary', // Use theme color
            '&:hover': {
              color: 'primary.main', // Use theme color on hover
            },
          }}
        >
          <AccountCircle sx={{ fontSize: 32 }} /> {/* Adjust size as needed */}
        </IconButton>
        
        {/* Render the page content passed as children */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;


import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// Import MUI Icons corresponding to lucide-react icons
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'; // Package -> Estoque
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'; // ShoppingCart -> Vendas
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'; // BarChart3 -> Relatórios
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'; // Users -> Clientes
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'; // Settings -> Admin

// Import the saved llama illustration
import logoLlama from '../assets/llama_illustration_1.png';

const drawerWidth = 256; // Define drawer width

const Sidebar = () => {
  // Reordered navItems as requested
  const navItems = [
    { name: 'Relatórios', path: '/relatorios', icon: BarChartOutlinedIcon },
    { name: 'Vendas', path: '/vendas', icon: ShoppingCartOutlinedIcon },
    { name: 'Clientes', path: '/clientes', icon: PeopleOutlineIcon },
    { name: 'Estoque', path: '/estoque', icon: Inventory2OutlinedIcon },
    { name: 'Admin', path: '/admin', icon: SettingsOutlinedIcon },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo section */}
      <Box sx={{ p: 2.5, textAlign: 'center' }}>
        <img 
          src={logoLlama} 
          alt="Tutto Baby Logo Llama" 
          style={{ width: 80, height: 'auto', margin: '0 auto 12px auto' }} 
        />
        <Typography variant="h6" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Tutto Baby
        </Typography>
      </Box>
      <Divider />
      {/* Navigation section */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                component={RouterNavLink}
                to={item.path}
                sx={{
                  py: 1.2, // Adjust vertical padding
                  px: 2.5, // Adjust horizontal padding
                  color: 'text.secondary',
                  '&.active': { // Style for active NavLink
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { // Style icon color when active
                      color: 'primary.contrastText',
                    },
                    '&:hover': { // Override hover when active
                      backgroundColor: 'primary.dark',
                    }
                  },
                  '&:hover': { // Hover style for non-active links
                    backgroundColor: 'action.hover',
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      {/* Footer section */}
      <Box sx={{ p: 2, mt: 'auto', textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2025 Tutto Baby
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box', 
          borderRight: '1px solid rgba(0, 0, 0, 0.12)', // Default MUI divider color
          backgroundColor: 'background.paper' // Use white background from theme
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;


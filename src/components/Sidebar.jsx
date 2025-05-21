// src/components/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  useTheme
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import logo from '../assets/logo.png';

const navItems = [
  { name: 'Estoque', path: '/estoque', icon: <Inventory2OutlinedIcon /> },
  { name: 'Vendas', path: '/vendas', icon: <ShoppingCartOutlinedIcon /> },
  { name: 'Clientes', path: '/clientes', icon: <PeopleOutlineIcon /> },
  { name: 'Relatórios', path: '/relatorios', icon: <BarChartOutlinedIcon /> },
  { name: 'Admin', path: '/admin', icon: <SettingsOutlinedIcon /> },
];

export default function Sidebar() {
  // Use theme directly to avoid relying on string references
  const theme = useTheme();
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        '& .MuiDrawer-paper': { 
          width: 240, 
          boxSizing: 'border-box',
          backgroundColor: '#ffffff', // Explicit background color
        },
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <img src={logo} alt="Logo" style={{ width: 100 }} />
      </Box>
      <Divider />
      <List>
        {navItems.map(({ name, path, icon }) => (
          <ListItem
            key={name}
            component={NavLink}
            to={path}
            sx={{
              color: theme.palette.text.primary, // Explicit text color
              '&.active': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.contrastText,
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              }
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'inherit',
                minWidth: '40px' // Ensure consistent icon spacing
              }}
            >
              {icon}
            </ListItemIcon>
            <ListItemText primary={name} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

// File: src/components/Sidebar.jsx
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import logoLlama from '../assets/llama_illustration_1.png';

const drawerWidth = 256;

const Sidebar = () => {
  const navItems = [
    { name: 'Relatórios', path: '/relatorios', icon: BarChartOutlinedIcon },
    { name: 'Vendas', path: '/vendas', icon: ShoppingCartOutlinedIcon },
    { name: 'Clientes', path: '/clientes', icon: PeopleOutlineIcon },
    { name: 'Estoque', path: '/estoque', icon: Inventory2OutlinedIcon },
    { name: 'Admin', path: '/admin', icon: SettingsOutlinedIcon },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2.5, textAlign: 'center' }}>
          <img
            src={logoLlama}
            alt="Tutto Baby Logo Llama"
            style={{ width: 80, margin: '0 auto 12px' }}
          />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Tutto Baby
          </Typography>
        </Box>
        <Divider />
        <List sx={{ flexGrow: 1, pt: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={RouterNavLink}
                  to={item.path}
                  sx={{
                    py: 1.2,
                    px: 2.5,
                    color: 'text.secondary',
                    '&.active': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                      '&:hover': { backgroundColor: 'primary.dark' },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
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
        <Box sx={{ p: 2, mt: 'auto', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            © 2025 Tutto Baby
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

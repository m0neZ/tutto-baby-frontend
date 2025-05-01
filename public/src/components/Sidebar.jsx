import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Package, // Estoque (Inventory)
  ShoppingCart, // Vendas (Sales)
  BarChart3, // Relatórios (Reports)
  Users, // Clientes (Clients)
  Settings // Admin
} from 'lucide-react';

// Import the saved llama illustration
import logoLlama from '../assets/llama_illustration_1.png'; // Adjust path if needed

const Sidebar = () => {
  const navItems = [
    { name: 'Estoque', path: '/estoque', icon: Package },
    { name: 'Vendas', path: '/vendas', icon: ShoppingCart },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Admin', path: '/admin', icon: Settings },
  ];

  const linkBaseClasses = "flex items-center px-4 py-3 rounded-lg transition-colors duration-200 text-text-secondary hover:bg-accent/50 hover:text-primary font-medium";
  const linkActiveClasses = "bg-primary text-white font-semibold shadow-sm"; // Use darkest green for active link, ensure text is white

  return (
    // Use white background for sidebar for a cleaner look, with a subtle border
    <aside className="w-64 bg-white text-text-primary flex flex-col border-r border-accent/50 shadow-sm">
      {/* Logo section with padding and border */}
      <div className="p-5 text-center border-b border-accent/50">
        <img src={logoLlama} alt="Tutto Baby Logo Llama" className="w-20 h-auto mx-auto mb-3" />
        {/* Brand name - using primary color */}
        <h1 className="text-xl font-semibold text-primary">Tutto Baby</h1>
      </div>
      {/* Navigation section with padding */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? linkActiveClasses : ''}`
              }
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      {/* Footer section */}
      <div className="p-4 mt-auto border-t border-accent/50 text-center text-xs text-text-secondary">
        <p>© 2025 Tutto Baby</p>
      </div>
    </aside>
  );
};

export default Sidebar;


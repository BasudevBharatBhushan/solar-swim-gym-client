import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Collapse,
} from '@mui/material';
import {
  PeopleAlt,
  Business,
  AccountBox,
  Badge,
  Settings,
  CardMembership,
  RoomService,
  Loyalty,
  LocalOffer,
  Email,
  ExpandLess,
  ExpandMore,
  DateRange,
  Tune,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  roleVerified?: (role: string | null) => boolean;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { text: 'Leads', icon: <PeopleAlt />, path: '/leads' },
  { text: 'Accounts', icon: <Business />, path: '/accounts' },
  { text: 'Profiles', icon: <AccountBox />, path: '/profiles' },
  { 
    text: 'Staff', 
    icon: <Badge />, 
    path: '/staff', 
    roleVerified: (role: string | null) => role === 'SUPER_ADMIN' 
  },
  {
    text: 'Settings',
    icon: <Settings />,
    children: [
      {
        text: 'Subscription Setting',
        icon: <Tune />,
        children: [
          { text: 'Age Group', icon: <DateRange />, path: '/settings/age-profiles' },
          { text: 'Subscription', icon: <CardMembership />, path: '/settings/subscription-terms' },
        ]
      },
      { text: 'Service', icon: <RoomService />, path: '/services' },
      { text: 'Membership', icon: <Loyalty />, path: '/memberships' },
      { text: 'Discount Codes', icon: <LocalOffer />, path: '/discounts' },
      { text: 'Email Settings', icon: <Email />, path: '/email-settings' },
    ]
  }
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  
  // State to track open/closed collapse items
  // Using a map key approach: "Settings", "Settings-Subscription Setting"
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const handleClick = (text: string) => {
    setOpenItems((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (item.roleVerified && !item.roleVerified(role)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = openItems[item.text] || false;
    const isSelected = item.path ? location.pathname.startsWith(item.path) : false;

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            selected={isSelected && !hasChildren} // Only highlight leaf nodes or handle parents differently
            onClick={() => {
              if (hasChildren) {
                handleClick(item.text);
              } else if (item.path) {
                handleNavigate(item.path);
              }
            }}
            sx={{ 
                pl: level * 2 + 2, // Indent based on level
                minHeight: 48,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
            {hasChildren ? (isExpanded ? <ExpandLess /> : <ExpandMore />) : null}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar /> {/* Spacer for AppBar */}
      <Divider />
      <List>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>
    </Drawer>
  );
};

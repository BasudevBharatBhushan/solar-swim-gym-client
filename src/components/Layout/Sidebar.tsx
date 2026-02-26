import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import {
  PeopleAlt,
  Business,
  AccountBox,
  Badge,
  Settings,
  CardMembership,
  Pool,
  Loyalty,
  LocalOffer,
  Email,
  ExpandLess,
  ExpandMore,
  DateRange,
  MonetizationOn,
  Description,
  CreditCard,
  Assignment,
} from '@mui/icons-material';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
//Import logo from asset
import logo from '../../assets/logo.png';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  roleVerified?: (role: string | null) => boolean;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { text: 'Leads', icon: <PeopleAlt />, path: '/admin/leads' },
  { text: 'Accounts', icon: <Business />, path: '/admin/accounts' },
  { text: 'Profiles', icon: <AccountBox />, path: '/admin/profiles' },
  { text: 'Transactions', icon: <MonetizationOn />, path: '/admin/transactions', roleVerified: (role: string | null) => role === 'SUPERADMIN' || role === 'ADMIN' || role === 'STAFF' },
  { text: 'Invoices', icon: <Description />, path: '/admin/invoices', roleVerified: (role: string | null) => role === 'SUPERADMIN' || role === 'ADMIN' || role === 'STAFF' },
  { 
    text: 'Staff', 
    icon: <Badge />, 
    path: '/admin/staff', 
    roleVerified: (role: string | null) => role === 'SUPERADMIN' 
  },
  {
    text: 'Settings',
    icon: <Settings />,
    children: [
      { text: 'Age Profile', icon: <DateRange />, path: '/admin/settings/age-profiles' },
      { text: 'Subscription Term', icon: <CardMembership />, path: '/admin/settings/subscription-terms' },
      { text: 'Sessions', icon: <DateRange />, path: '/admin/settings/sessions' },
      { text: 'Services', icon: <Pool />, path: '/admin/services' },
      {
        text: 'Membership',
        icon: <Loyalty />,
        children: [
          { text: 'Member Pricing', icon: <MonetizationOn />, path: '/admin/settings/base-plan' },
          { text: 'Annual Fees', icon: <Assignment />, path: '/admin/memberships' },
        ]
      },
      { text: 'Waiver Programs', icon: <Description />, path: '/admin/settings/waiver-programs' },
      { text: 'Discount Codes', icon: <LocalOffer />, path: '/admin/discounts' },
      { text: 'Waiver & Contract', icon: <Assignment />, path: '/admin/settings/waiver-templates' },
      { text: 'Email Settings', icon: <Email />, path: '/admin/email-settings' },
      { text: 'Dropdown Values', icon: <Assignment />, path: '/admin/settings/dropdown-values' },
      { text: 'Billing', icon: <CreditCard />, path: '/admin/billing' },
    ]
  }
];

export const Sidebar = () => {
  const location = useLocation();
  const { role, userParams } = useAuth();
  
  // State to track open/closed collapse items
  // Using a map key approach: "Settings", "Settings-Subscription Setting"
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const handleClick = (text: string) => {
    setOpenItems((prev) => ({ ...prev, [text]: !prev[text] }));
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
        {/* Add section labels */}
        {level === 0 && item.text === 'Leads' && (
          <Typography 
            variant="caption" 
            sx={{ 
              px: 3, 
              pt: 3, 
              pb: 1, 
              display: 'block', 
              color: 'rgba(248, 250, 252, 0.4)', 
              fontWeight: 700, 
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.65rem'
            }}
          >
            Main Menu
          </Typography>
        )}
        {level === 0 && item.text === 'Settings' && (
          <Typography 
            variant="caption" 
            sx={{ 
              px: 3, 
              pt: 3, 
              pb: 1, 
              display: 'block', 
              color: 'rgba(248, 250, 252, 0.4)', 
              fontWeight: 700, 
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.65rem'
            }}
          >
            System
          </Typography>
        )}
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            selected={isSelected && !hasChildren} // Only highlight leaf nodes or handle parents differently
            {...(!hasChildren && item.path ? { component: Link, to: item.path } : {})}
            onClick={() => {
              if (hasChildren) {
                handleClick(item.text);
              }
            }}
            sx={{ 
                pl: level * 2 + 2, // Indent based on level
                minHeight: 48,
                mb: 0.5,
                borderLeft: '3px solid transparent', // Placeholder for alignment
                '&.Mui-selected': {
                  backgroundColor: 'rgba(59, 130, 246, 0.12)', // Blue tint
                  borderLeft: '3px solid #3b82f6', // Active indicator
                  color: '#3b82f6',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.20)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#3b82f6',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#3b82f6',
                    fontWeight: 600,
                  }
                },
                '&:hover': {
                   backgroundColor: 'rgba(255, 255, 255, 0.04)',
                   '& .MuiListItemIcon-root': {
                      color: '#fff',
                   }
                }
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
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a', // Slightly darker than the theme for better contrast if needed, or stick to theme
          borderRight: '1px solid rgba(255, 255, 255, 0.05)'
        },
      }}
    >
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        scrollbarWidth: 'none', 
        '&::-webkit-scrollbar': {
          display: 'none',
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: '', minHeight: 64 }}>
          <img 
            src={logo} 
            alt="Zalexy" 
            style={{ height: '50px', marginRight: '10px' }} 
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                color: 'white', 
                fontSize: '1.25rem', 
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
                textTransform: 'none'
              }}
            >
              Zalexy
            </Typography>
          </Box>
        </Box>
        <List>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Admin Profile Section */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.05)' }} />
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          p: 1.5, 
          borderRadius: 2,
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.08)',
          }
        }}>
          <Avatar 
            sx={{ 
              width: 38, 
              height: 38, 
              bgcolor: '#3b82f6',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {userParams?.first_name ? 
              `${userParams.first_name[0]}${userParams.last_name?.[0] || ''}` : 
              (role?.includes('ADMIN') ? 'AD' : 'U')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#f8fafc', 
                fontWeight: 600,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {userParams?.first_name ? `${userParams.first_name} ${userParams.last_name || ''}` : 'Admin User'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(248, 250, 252, 0.5)', 
                fontSize: '0.75rem',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {userParams?.email || 'admin@zalexy.com'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#3b82f6', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                mt: 0.25,
                display: 'inline-block',
                px: 0.75,
                py: 0.1,
                borderRadius: 1,
                bgcolor: 'rgba(59, 130, 246, 0.1)'
              }}
            >
              {role?.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

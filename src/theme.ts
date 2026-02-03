import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e293b', // Deep Slate / Navy - Professional & Admin-like
    },
    secondary: {
      main: '#06b6d4', // Cyan - Vibrant accent
    },
    background: {
      default: '#f1f5f9', // Very light grey blue
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569', // Slate 600
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, color: '#0f172a' },
    h2: { fontSize: '1.75rem', fontWeight: 600, color: '#0f172a' },
    h3: { fontSize: '1.5rem', fontWeight: 600, color: '#0f172a' },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.12)', // Subtle border/shadow
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e293b', // Dark sidebar
          color: '#f8fafc',
          borderRight: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Slightly sharper corners
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: '#0f172a',
          '&:hover': { backgroundColor: '#1e293b' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 8,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Tailwind-ish shadow
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
          color: '#475569',
          borderBottom: '1px solid #e2e8f0',
        },
        root: {
          padding: '12px 16px', // Slightly more breathing room than before
          fontSize: '0.875rem',
          borderBottom: '1px solid #f1f5f9',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#94a3b8', // Light slate for icons on dark background
          minWidth: 40,
        },
      },
    },
    MuiListItemText: {
        styleOverrides: {
            primary: {
                color: '#f8fafc',
                fontSize: '0.9rem',
            }
        }
    }
  },
});

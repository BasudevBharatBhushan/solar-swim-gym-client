import { createTheme, alpha } from '@mui/material/styles';

// Color Palette - Faded Blues & Soft Greens
const colors = {
  primary: {
    main: '#334155', // Slate 700 - Deep professional blue-grey
    light: '#475569', // Slate 600
    dark: '#1e293b', // Slate 800
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#10b981', // Emerald 500 - Soft modern green
    light: '#34d399', // Emerald 400
    dark: '#059669', // Emerald 600
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981', // Emerald 500
    light: '#d1fae5', // Emerald 50
    dark: '#047857',
    contrastText: '#ffffff',
  },
  info: {
    main: '#3b82f6', // Blue 500
    light: '#eff6ff', // Blue 50
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f8fafc', // Slate 50
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a', // Slate 900
    secondary: '#64748b', // Slate 500
  },
  border: '#f1f5f9', // Slate 100 - Very soft border
  action: {
    hover: alpha('#475569', 0.04),
    selected: alpha('#475569', 0.08),
  }
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    info: colors.info,
    background: colors.background,
    text: colors.text,
    divider: colors.border,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, color: colors.text.primary, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.75rem', fontWeight: 600, color: colors.text.primary, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, color: colors.text.primary },
    h4: { fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary },
    h5: { fontSize: '1rem', fontWeight: 600, color: colors.text.primary, textTransform: 'uppercase', letterSpacing: '0.05em' },
    h6: { fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary },
    body1: { fontSize: '0.875rem', lineHeight: 1.6, color: colors.text.primary },
    body2: { fontSize: '0.8rem', lineHeight: 1.5, color: colors.text.secondary },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          color: colors.text.primary,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: colors.text.primary,
          boxShadow: `0px 1px 1px ${alpha(colors.primary.main, 0.03)}`,
          borderBottom: 'none', // Removed border
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
          borderRadius: 6,
          boxShadow: 'none',
          padding: '8px 16px',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#3b82f6', // Use the bright blue for primary actions like "Add New"
          color: '#ffffff',
          '&:hover': { backgroundColor: '#2563eb' },
        },
        containedSecondary: {
            backgroundColor: colors.secondary.main,
            color: '#ffffff',
            '&:hover': { backgroundColor: colors.secondary.dark },
        },
        outlined: {
          borderColor: colors.border,
          color: colors.text.primary,
          '&:hover': {
            borderColor: colors.primary.main,
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 10,
          border: 'none', // Removed explicit border
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02), 0px 1px 2px rgba(0, 0, 0, 0.03)',
        },
        elevation0: {
          boxShadow: 'none',
          border: 'none',
        },
        elevation1: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
            border: 'none',
        }
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: 'transparent', 
          color: '#64748b', // Muted text for headers
          borderBottom: `1px solid ${colors.border}`,
          fontSize: '0.725rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '12px 16px',
        },
        root: {
          padding: '16px 16px',
          fontSize: '0.875rem',
          borderBottom: `1px solid ${colors.border}`,
          color: colors.text.primary,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': {
            border: 0,
          },
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
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
            backgroundColor: '#fff',
            '& fieldset': {
              borderColor: colors.border,
            },
            '&:hover fieldset': {
              borderColor: alpha(colors.primary.main, 0.2),
            },
            '&.Mui-focused fieldset': {
              borderColor: alpha(colors.primary.main, 0.4), // Softer focus
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 24,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: alpha('#f8fafc', 0.7),
          minWidth: 40,
        },
      },
    },
    MuiListItemText: {
        styleOverrides: {
            primary: {
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: 500,
            }
        }
    },
  },
});

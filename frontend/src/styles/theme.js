import { createTheme } from '@mui/material/styles';

// Define the application theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dabf5',  // Electric blue as primary color
      light: '#81d4fa',
      dark: '#2196f3',
    },
    secondary: {
      main: '#b388ff',  // Deep purple as secondary color
      light: '#e1bee7',
      dark: '#7e57c2',
    },
    accent: {
      main: '#00bcd4',  // Teal accent
      light: '#4dd0e1',
      dark: '#0097a7',
    },
    background: {
      default: '#121824',
      paper: '#1E293B',
      cardGradient: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(20, 30, 48, 0.7) 100%)',
      gradient: 'linear-gradient(180deg, #121824 0%, #0F141B 100%)',
    },
    action: {
      hover: 'rgba(77, 171, 245, 0.08)',
      selected: 'rgba(77, 171, 245, 0.16)',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
    h1: {
      fontWeight: 500,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontWeight: 500,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontWeight: 500,
      letterSpacing: '0em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.0075em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(20, 30, 48, 0.7) 100%)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'linear-gradient(145deg, #1e1e1e 0%, #252525 100%)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(77, 171, 245, 0.04)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #121212 0%, #1e1e1e 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
});

export default theme; 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AuthProvider from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateReport from './pages/CreateReport';
import ViewReport from './pages/ViewReport';
import NotFound from './pages/NotFound';
import AdminDashboard from './components/AdminDashboard';
import CreateReportModal from './components/modals/CreateReportModal';
import ViewCommitsModal from './components/modals/ViewCommitsModal';
import AuthCallback from './pages/AuthCallback';

// Create a dark theme
const darkTheme = createTheme({
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
      default: '#121212',
      paper: '#1e1e1e',
      gradient: 'linear-gradient(145deg, #121212 0%, #1a1a1a 100%)',
      cardGradient: 'linear-gradient(145deg, #1e1e1e 0%, #252525 100%)',
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
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
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

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/create-report"
                element={
                  <PrivateRoute>
                    <CreateReport />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports/:id"
                element={
                  <PrivateRoute>
                    <ViewReport />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Global Modals */}
            <CreateReportModal />
            <ViewCommitsModal />
          </Router>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

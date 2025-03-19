import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AuthContext from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import PrivateRouteComponent from './components/PrivateRouteComponent';
import AdminRouteComponent from './components/AdminRouteComponent';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateReportPage from './pages/CreateReportPage';
import ViewReportPage from './pages/ViewReportPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboardComponent from './components/AdminDashboardComponent';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import CreateReportModalComponent from './components/modals/CreateReportModalComponent';
import ViewCommitsModalComponent from './components/modals/ViewCommitsModalComponent';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dabf5',
    },
    secondary: {
      main: '#1de9b6',
    },
    background: {
      default: '#121824',
      paper: '#1E293B',
      cardGradient: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(20, 30, 48, 0.7) 100%)',
      gradient: 'linear-gradient(180deg, #121824 0%, #0F141B 100%)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
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
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(20, 30, 48, 0.7) 100%)',
          backdropFilter: 'blur(10px)',
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
          backgroundImage: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(20, 30, 48, 0.7) 100%)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRouteComponent>
                    <DashboardPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/reports/:id" 
                element={
                  <PrivateRouteComponent>
                    <ViewReportPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/create-report" 
                element={
                  <PrivateRouteComponent>
                    <CreateReportPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/analytics" 
                element={
                  <PrivateRouteComponent>
                    <AnalyticsDashboardPage />
                  </PrivateRouteComponent>
                }
              />
              
              <Route 
                path="/admin" 
                element={
                  <AdminRouteComponent>
                    <AdminDashboardComponent />
                  </AdminRouteComponent>
                }
              />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Global Modals */}
            <CreateReportModalComponent />
            <ViewCommitsModalComponent />
          </Router>
        </ModalProvider>
      </AuthContext>
    </ThemeProvider>
  );
}

export default App;


import { createRoot } from 'react-dom/client';
import { Snackbar, Alert, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

// Create a container for the notifications
let notificationContainer;

// Initialize the notification container
const initContainer = () => {
  if (!notificationContainer) {
    // Create a container if it doesn't exist
    const containerElement = document.createElement('div');
    containerElement.id = 'toast-notification-container';
    document.body.appendChild(containerElement);
    
    // Apply styles to position the container
    Object.assign(containerElement.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '2000',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '400px',
      pointerEvents: 'none' // Allow clicking through when no toasts are shown
    });
    
    notificationContainer = containerElement;
  }
  
  return notificationContainer;
};

// Get the icon based on severity
const getIcon = (severity) => {
  switch (severity) {
    case 'success':
      return <CheckCircleIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'info':
      return <InfoIcon />;
    case 'warning':
      return <WarningIcon />;
    default:
      return <InfoIcon />;
  }
};

// Show a toast notification
const showNotification = (message, severity, duration = 5000) => {
  
  // Initialize container
  const container = initContainer();
  
  // Create unique ID for this notification
  const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Create notification element
  const notificationElement = document.createElement('div');
  notificationElement.id = id;
  container.appendChild(notificationElement);
  
  // Create root for React
  const root = createRoot(notificationElement);
  
  // Render notification
  root.render(
    <Box sx={{ pointerEvents: 'auto' }}>
      <Snackbar
        open={true}
        autoHideDuration={duration}
        onClose={() => {
          // Unmount and remove from DOM after closing
          setTimeout(() => {
            root.unmount();
            if (notificationElement.parentNode) {
              notificationElement.parentNode.removeChild(notificationElement);
            }
          }, 300); // Small delay to allow exit animation
        }}
        sx={{ position: 'static', mb: 1 }}
      >
        <Alert
          severity={severity}
          variant="filled"
          icon={getIcon(severity)}
          elevation={6}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
  
  // Auto-remove after duration + buffer
  setTimeout(() => {
    if (notificationElement.parentNode) {
      root.unmount();
      notificationElement.parentNode.removeChild(notificationElement);
    }
  }, duration + 1000);
};

/**
 * Toast notification service
 * Used to provide consistent toast messages across the application
 */
const toast = {
  /**
   * Show a success notification
   * @param {string} message - The message to show
   * @param {number} duration - How long to show the notification (ms)
   */
  success: (message, duration = 5000) => {
    showNotification(message, 'success', duration);
  },
  
  /**
   * Show an error notification
   * @param {string} message - The message to show
   * @param {number} duration - How long to show the notification (ms)
   */
  error: (message, duration = 8000) => {
    showNotification(message, 'error', duration);
  },
  
  /**
   * Show an info notification
   * @param {string} message - The message to show
   * @param {number} duration - How long to show the notification (ms)
   */
  info: (message, duration = 5000) => {
    showNotification(message, 'info', duration);
  },
  
  /**
   * Show a warning notification
   * @param {string} message - The message to show
   * @param {number} duration - How long to show the notification (ms)
   */
  warning: (message, duration = 6000) => {
    showNotification(message, 'warning', duration);
  }
};

export default toast;

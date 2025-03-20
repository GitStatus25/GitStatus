import useAuthStore from '../../store/authStore';

const { user, isAuthenticated, logout } = useAuthStore();

const handleLogout = () => {
  logout();
}; 
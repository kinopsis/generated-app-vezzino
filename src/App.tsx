import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { Toaster } from "@/components/ui/sonner";
export default function App() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  useEffect(() => {
    // On initial load, check if the user is authenticated.
    // If not, redirect to the /auth page.
    if (!token || !user) {
      navigate('/auth', { replace: true });
    }
  }, [token, user, navigate]);
  // If still loading or redirecting, show a blank screen or a loader
  if (!token || !user) {
    return null; // Or a global loading spinner
  }
  // Render the protected application layout
  return (
    <>
      <Outlet />
      <Toaster richColors />
    </>
  );
}
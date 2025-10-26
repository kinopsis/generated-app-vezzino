import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import App from './App';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
import AssembliesPage from './pages/AssembliesPage';
import LiveAssemblyPage from './pages/LiveAssemblyPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import AssemblySetupPage from './pages/AssemblySetupPage';
import ProfilePage from './pages/ProfilePage';
import AuditLogPage from './pages/AuditLogPage';
import TenantsPage from './pages/superadmin/TenantsPage';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app",
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "assemblies",
        element: <AssembliesPage />,
      },
      {
        path: "assemblies/:id",
        element: <LiveAssemblyPage />,
      },
      {
        path: "assemblies/:id/setup",
        element: <AssemblySetupPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "audit-logs",
        element: <AuditLogPage />,
      },
      {
        path: "superadmin/tenants",
        element: <TenantsPage />,
      },
    ]
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
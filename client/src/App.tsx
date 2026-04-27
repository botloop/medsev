/**
 * Main App Component
 * Setup routing and authentication
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/common/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
                  <Box textAlign="center">
                    <Typography fontSize={64} mb={2}>🔍</Typography>
                    <Typography variant="h5" fontWeight={700} mb={1}>Page Not Found</Typography>
                    <Typography color="text.secondary" mb={3}>The page you're looking for doesn't exist.</Typography>
                    <Button variant="contained" href="/dashboard">Go to Dashboard</Button>
                  </Box>
                </Box>
              }
            />
          </Routes>
        </BrowserRouter>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

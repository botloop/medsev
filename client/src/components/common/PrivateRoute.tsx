/**
 * Private Route Component
 * Protect routes that require authentication
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredPermission }) => {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1d4ed8 100%)' }}>
        <style>{`
          @keyframes pcg-spin { to { transform: rotate(360deg); } }
          @keyframes pcg-dot { 0%, 80%, 100% { transform: translateY(0); opacity: 0.35; } 40% { transform: translateY(-10px); opacity: 1; } }
          @keyframes pcg-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={{ textAlign: 'center', color: 'white', animation: 'pcg-fade-in 0.6s ease-out' }}>
          {/* Spinning ring with anchor */}
          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 28px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#60a5fa', borderRightColor: '#93c5fd', animation: 'pcg-spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>⚓</div>
          </div>
          {/* Title block */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', marginBottom: 8 }}>Philippine Coast Guard</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>MEDS-EV System</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 }}>Medical Service Eastern Visayas</div>
          </div>
          {/* Bouncing dots */}
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 32 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', animation: `pcg-dot 1.3s ease-in-out ${i * 0.18}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission if required
  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You do not have permission to access this resource.
            </p>
            <p className="text-sm text-gray-500">
              Required permission: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

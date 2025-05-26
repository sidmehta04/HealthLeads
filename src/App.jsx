import React, { lazy, Suspense, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Lazy load components
const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const HealthCampForm = lazy(() => import("./components/HealthCampForm"));
const IndividualHealthCampForm = lazy(() =>
  import("./components/IndividualHealthCampForm")
);
const SuperAdminDashboard = lazy(() =>
  import("./components/SuperAdminDashboard")
);
const AdminHealthCampDashboard = lazy(() => 
  import("./components/dashboards/HealthAdminDashboard")
);
const Layout = lazy(() => import("./components/Layout"));

function LoadingSpinner() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Unauthorized Access
          </h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            404 - Page Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The page you're looking for doesn't exist.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const clearBrowserData = async () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch (error) {
    console.error("Error clearing browser data:", error);
  }
};

function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser && !loading) {
      clearBrowserData();
    }
  }, [currentUser, loading]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function RequireRole({ children, allowedRoles }) {
  const { userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}

function LayoutWrapper() {
  const { currentUser, userRole } = useAuth();

  const getDefaultRedirect = () => {
    if (!currentUser) return "/login";
    switch (userRole) {
      case "superadmin":
        return "/superadmin";
      case "health-camp-admin":
        return "/admin-dashboard"; // Updated default redirect for health-camp-admin
      case "individual-camp-admin":
        return "/individual-health-camp";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <Layout>
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to={getDefaultRedirect()} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/"
              element={<Navigate to={getDefaultRedirect()} replace />}
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            {/* New Route for Admin Health Camp Dashboard */}
            <Route
              path="/admin-dashboard"
              element={
                <RequireAuth>
                  <RequireRole allowedRoles={["health-camp-admin"]}>
                    <AdminHealthCampDashboard />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/superadmin/*"
              element={
                <RequireAuth>
                  <RequireRole allowedRoles={["superadmin"]}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route index element={<SuperAdminDashboard />} />
                        <Route
                          path="health-camp"
                          element={<HealthCampForm />}
                        />
                        <Route
                          path="individual-health-camp"
                          element={<IndividualHealthCampForm />}
                        />
                        <Route index element={<Dashboard />} />
                      </Routes>
                    </Suspense>
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/health-camp"
              element={
                <RequireAuth>
                  <RequireRole
                    allowedRoles={["health-camp-admin", "superadmin"]}
                  >
                    <HealthCampForm />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/individual-health-camp"
              element={
                <RequireAuth>
                  <RequireRole
                    allowedRoles={[
                      "health-camp-admin",
                      "individual-camp-admin",
                      "superadmin",
                    ]}
                  >
                    <IndividualHealthCampForm />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Suspense>
    </div>
  );
}

function App() {
  useEffect(() => {
    const handleCleanup = () => {
      clearBrowserData();
    };

    window.addEventListener("beforeunload", handleCleanup);
    window.addEventListener("unload", handleCleanup);

    return () => {
      window.removeEventListener("beforeunload", handleCleanup);
      window.removeEventListener("unload", handleCleanup);
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="w-full min-h-screen">
          <Suspense fallback={<LoadingSpinner />}>
            <LayoutWrapper />
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
import React, { useState, useCallback, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  HeartPulse,
  UserPlus,
  ShieldCheck,
  Menu,
  X,
  User,
  LogOut,
  Home,
  BarChart
} from "lucide-react";

// Memoized NavLink component to prevent unnecessary re-renders
const NavLink = memo(({ item, userRole, isActive, onClose }) => {
  if (!item.roles.includes(userRole)) return null;

  const active = isActive(item.path);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${
          active
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-600 hover:bg-gray-100"
        }
      `}
      onClick={onClose}
    >
      <Icon className="w-5 h-5" />
      {item.label}
    </Link>
  );
});

// Navigation items defined outside component to prevent recreation
const navItems = [
  {
    path: "/superadmin",
    label: "Admin Dashboard",
    icon: ShieldCheck,
    roles: ["superadmin"],
  },
  {
    path: "/admin-dashboard",
    label: "Health Camp Stats",
    icon: BarChart,
    roles: ["health-camp-admin"],
  },
  {
    path: "/dashboard",
    label: "DataBase",
    icon: LayoutDashboard,
    roles: ["individual-camp-admin","health-camp-admin"],
  },
  {
    path: "/health-camp",
    label: "Health Camp",
    icon: HeartPulse,
    roles: ["health-camp-admin", "superadmin"],
  },
  {
    path: "/individual-health-camp",
    label: "Home Collection",
    icon: Home,
    roles: ["health-camp-admin", "individual-camp-admin", "superadmin"],
  },
];

export function Navigation() {
  const { currentUser, userRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }, [logout, navigate]);

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  const handleMobileMenuClose = useCallback(
    () => setIsMobileMenuOpen(false),
    []
  );

  const toggleMobileMenu = useCallback(
    () => setIsMobileMenuOpen((prev) => !prev),
    []
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <Link
                to="/individual-health-camp"
                className="flex items-center gap-2"
              >
                <HeartPulse className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Diagnostics Portal
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-2 ml-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  userRole={userRole}
                  isActive={isActive}
                  onClose={handleMobileMenuClose}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {currentUser.email.split("@")[0]}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`
            md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200
            transition-all duration-200 ease-in-out
            ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}
          `}
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                userRole={userRole}
                isActive={isActive}
                onClose={handleMobileMenuClose}
              />
            ))}

            <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              {currentUser.email}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navigation);
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const clearSession = () => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
      if ('caches' in window) {
        caches.keys().then(keys => {
          keys.forEach(key => caches.delete(key));
        });
      }
    };
    clearSession();
  }, []);

  useEffect(() => {
    const handleAuthState = async () => {
      if (currentUser) {
        localStorage.setItem('lastActivity', new Date().getTime().toString());
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    };
    handleAuthState();
  }, [currentUser, navigate, location]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      localStorage.clear();
      sessionStorage.clear();
      await login(email, password);
      localStorage.setItem('lastActivity', new Date().getTime().toString());
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <div className="w-full max-w-xl px-4">
        <Card className="w-full border-none shadow-2xl rounded-xl bg-white/90 backdrop-blur-lg">
          <CardHeader className="space-y-6 text-center">
            <div className="mx-auto bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center shadow-md">
              <Lock className="text-white w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Health Camp Portal
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to access your account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email-address" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-2 text-base"
                    placeholder="Enter your email address"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 py-2 text-base"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
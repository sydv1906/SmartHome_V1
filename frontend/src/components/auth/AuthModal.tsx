'use client';

import React, { useState } from 'react';
import { Zap, Mail, Lock, User as UserIcon, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AuthModal: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('owner@smarthome.ai');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('Alex Rivera');
  const [role, setRole] = useState<string>('Owner');
  const [otpStep, setOtpStep] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('492018');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!otpStep) {
          setOtpStep(true);
          setLoading(false);
          return;
        }
        await register(name, email, password, role);
      }
    } catch (err: any) {
      alert(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkBg/95 backdrop-blur-xl">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl border border-cyan-500/40 p-8 space-y-6 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-glowCyan">
            <div className="w-full h-full bg-darkBg rounded-[15px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-neonCyan animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white">SmartHome AI</h2>
          <p className="text-xs text-cyan-400">Intelligent Energy Monitoring & Smart Appliance Control</p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !otpStep && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {!otpStep ? (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:border-cyan-400"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:border-cyan-400"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            /* OTP Step */
            <div className="text-center space-y-3">
              <p className="text-xs text-gray-300">Enter 6-digit OTP code sent to {email}</p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-cyan-400 text-center text-lg font-mono text-cyan-300 tracking-widest"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 text-white text-xs font-bold shadow-glowCyan hover:opacity-90 transition-opacity"
          >
            {loading
              ? 'Authenticating...'
              : isLogin
              ? 'Sign In to SmartHome AI'
              : otpStep
              ? 'Verify OTP & Complete Signup'
              : 'Continue to OTP Verification'}
          </button>
        </form>

        {/* Quick Demo Sign In Buttons */}
        <div className="space-y-2 border-t border-gray-800/80 pt-4">
          <p className="text-[10px] text-gray-400 uppercase font-semibold text-center">Quick Demo Login Presets:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('owner@smarthome.ai')}
              className="py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-cyan-300 text-xs font-semibold text-center"
            >
              🔑 Demo Owner
            </button>
            <button
              onClick={() => handleDemoLogin('admin@smarthome.ai')}
              className="py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-rose-300 text-xs font-semibold text-center"
            >
              🛡️ Demo Admin
            </button>
          </div>
        </div>

        {/* Toggle Login/Signup */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setOtpStep(false);
            }}
            className="text-xs text-cyan-400 hover:underline"
          >
            {isLogin ? "Don't have an account? Create one" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

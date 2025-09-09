import React, { ReactNode } from 'react';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authState, login, signUp, logout, setAuthUser, resetPassword, useUpdateUserNotifications } = useAuthProvider();

  const value = {
    authState,
    login,
    signUp,
    logout,
    setAuthUser,
    resetPassword,
    useUpdateUserNotifications,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
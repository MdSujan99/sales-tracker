import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types/statement';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface RestaurantProfile {
  id: string;
  name: string;
  branch: string;
  currency: string;
}

interface AuthContextType {
  user: UserProfile;
  restaurant: RestaurantProfile;
  isOnline: boolean;
  isSupabaseConnected: boolean;
  switchRole: (role: UserRole) => void;
  updateRestaurantName: (name: string) => void;
}

const DEFAULT_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'accountant@restaurant.com',
  name: 'Accountant',
  role: 'ACCOUNTANT',
};

const DEFAULT_RESTAURANT: RestaurantProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Daily Cash Statement',
  branch: 'Main Branch',
  currency: 'INR',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('app_user_profile');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [restaurant, setRestaurant] = useState<RestaurantProfile>(() => {
    const saved = localStorage.getItem('app_restaurant_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Royal Spice Restaurant') {
          return DEFAULT_RESTAURANT;
        }
        return parsed;
      } catch {
        // Fallback
      }
    }
    return DEFAULT_RESTAURANT;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If Supabase is configured, check auth session
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setUser(prev => ({
            ...prev,
            id: data.session!.user.id,
            email: data.session!.user.email || prev.email,
          }));
          setIsSupabaseConnected(true);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchRole = (newRole: UserRole) => {
    const updated: UserProfile = {
      ...user,
      role: newRole,
      name: newRole === 'ACCOUNTANT' ? 'Head Accountant' : 'Restaurant Owner',
      email: newRole === 'ACCOUNTANT' ? 'accountant@restaurant.com' : 'owner@restaurant.com',
    };
    setUser(updated);
    localStorage.setItem('app_user_profile', JSON.stringify(updated));
  };

  const updateRestaurantName = (name: string) => {
    const updated = { ...restaurant, name };
    setRestaurant(updated);
    localStorage.setItem('app_restaurant_profile', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        isOnline,
        isSupabaseConnected,
        switchRole,
        updateRestaurantName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

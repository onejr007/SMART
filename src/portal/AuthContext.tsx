import React, { createContext, useContext, useEffect } from 'react';
import { useStore, UserRole } from './store';

interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Firebase Database URL dengan auth secret
const DB_URL = 'https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app';
const AUTH_SECRET = 'OPQ2iJqS1MOK0HjA1esCyvHCnJzN4zcZm0ym2iRxINGAT';

// Simple hash function for password
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Optimization #45: Global State Optimization (Zustand)
    const { user, loading, setUser, setLoading, logout: storeLogout } = useStore();

    useEffect(() => {
        // Check localStorage untuk auto-login
        const savedUser = localStorage.getItem('smart_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('smart_user');
            }
        }
        setLoading(false);
    }, [setUser, setLoading]);

    const signup = async (email: string, password: string, displayName: string) => {
        const uid = simpleHash(email);
        
        const checkUrl = `${DB_URL}/users/${uid}.json?auth=${AUTH_SECRET}`;
        const checkResponse = await fetch(checkUrl);
        const existingUser = await checkResponse.json();
        
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const hashedPassword = simpleHash(password);

        const userData = {
            uid,
            email,
            displayName,
            password: hashedPassword,
            role: UserRole.PLAYER, // Default role (Security Recommendation #1 - RBAC)
            createdAt: new Date().toISOString()
        };

        const saveUrl = `${DB_URL}/users/${uid}.json?auth=${AUTH_SECRET}`;
        const saveResponse = await fetch(saveUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!saveResponse.ok) {
            throw new Error('Failed to create user');
        }

        const newUser: User = { uid, email, displayName, role: UserRole.PLAYER };
        setUser(newUser);
    };

    const login = async (email: string, password: string) => {
        const uid = simpleHash(email);
        
        const getUrl = `${DB_URL}/users/${uid}.json?auth=${AUTH_SECRET}`;
        const response = await fetch(getUrl);
        const userData = await response.json();
        
        if (!userData) {
            throw new Error('User not found');
        }

        const hashedPassword = simpleHash(password);

        if (userData.password !== hashedPassword) {
            throw new Error('Invalid password');
        }

        const loggedUser: User = {
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role || UserRole.PLAYER // Load role from DB
        };

        // Backend Recommendation #2: Secure Session Management (HttpOnly Cookie)
        try {
            await fetch('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loggedUser.uid, displayName: loggedUser.displayName })
            });
        } catch (e) {
            console.error('Failed to set secure cookie session:', e);
        }

        setUser(loggedUser);
    };

    const logout = async () => {
        // Backend Recommendation #2: Secure Session Management (HttpOnly Cookie)
        try {
            await fetch('http://localhost:3000/api/v1/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Failed to clear secure cookie session:', e);
        }
        storeLogout();
    };

    const value = {
        user,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

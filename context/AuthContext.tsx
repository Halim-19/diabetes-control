import { Profile, supabase, UserRole } from '@/utils/supabase';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

interface AuthContextType {
    session: Session | null;
    profile: Profile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    role: UserRole | null;
    profileComplete: boolean;
    login: (email: string, password: string) => Promise<{ error: string | null, userRole?: string | null }>;
    signUp: (email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) {
                console.error('Error fetching profile:', error.message);
                setProfile(null);
            } else {
                setProfile(data as Profile);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            setProfile(null);
        } finally {
            setIsLoading(false);
            // Request notification permissions and update token if authenticated
            if (userId) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
                }
            }
        }
    };

    const refreshProfile = async () => {
        if (session?.user?.id) await fetchProfile(session.user.id);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user?.id) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user?.id) {
                setIsLoading(true);
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<{ error: string | null, userRole?: string | null }> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };

        let userRole = null;
        if (data.user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (profileData) userRole = profileData.role;
        }
        return { error: null, userRole };
    };

    const signUp = async (
        email: string,
        password: string,
        role: UserRole
    ): Promise<{ error: string | null }> => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { role } },
        });
        if (error) return { error: error.message };

        return { error: null };
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{
            session,
            profile,
            isAuthenticated: !!session,
            isLoading,
            role: profile?.role ?? (session?.user?.user_metadata?.role as UserRole) ?? null,
            profileComplete: profile?.profile_complete ?? false,
            login,
            signUp,
            logout,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export type { UserRole };

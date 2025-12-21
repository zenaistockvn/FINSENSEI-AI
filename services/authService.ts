/**
 * Supabase Authentication Service
 * Xử lý đăng nhập, đăng ký, đăng xuất với Supabase Auth
 */

import { createClient, User, Session, AuthError } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  plan: 'basic' | 'vip' | 'expert';
  plan_expires_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

// Sign up with email and password
export async function signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          plan: 'basic'
        },
        // Tắt xác thực email - user có thể đăng nhập ngay
        emailRedirectTo: undefined
      }
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    // Create user profile in profiles table
    if (data.user) {
      await createUserProfile(data.user.id, email, fullName);
    }

    // Nếu có session nghĩa là không cần xác thực email
    // User có thể đăng nhập ngay
    if (data.session) {
      return { 
        success: true, 
        user: data.user || undefined, 
        session: data.session
      };
    }

    // Nếu không có session, cần xác thực email (tùy cấu hình Supabase)
    return { 
      success: true, 
      user: data.user || undefined, 
      session: undefined 
    };
  } catch (err) {
    return { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { 
      success: true, 
      user: data.user, 
      session: data.session 
    };
  } catch (err) {
    return { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
  }
}

// Sign out
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Đã xảy ra lỗi khi đăng xuất.' };
  }
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Get user profile from profiles table
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    return null;
  }
}

// Create user profile
async function createUserProfile(userId: string, email: string, fullName: string): Promise<void> {
  try {
    await supabase.from('user_profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      plan: 'basic',
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating user profile:', err);
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  } catch (err) {
    return false;
  }
}

// Reset password
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
  } catch (err) {
    console.error('Google sign in exception:', err);
    return { success: false, error: 'Không thể đăng nhập bằng Google. Vui lòng thử lại.' };
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// Helper function to get Vietnamese error messages
function getErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Email hoặc mật khẩu không đúng';
    case 'Email not confirmed':
      return 'Vui lòng xác nhận email trước khi đăng nhập';
    case 'User already registered':
      return 'Email này đã được đăng ký';
    case 'Password should be at least 6 characters':
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    case 'Unable to validate email address: invalid format':
      return 'Định dạng email không hợp lệ';
    default:
      return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}

export default {
  supabase,
  signUp,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  resetPassword,
  updatePassword,
  signInWithGoogle,
  onAuthStateChange
};

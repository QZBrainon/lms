import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthError,
} from "@/types/auth";
import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  return useAuthContext();
};

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      navigate("/dashboard");
    },
    onError: (error: AuthError) => {
      console.error("Login error:", error.message);

      // Check for specific HTTP status codes
      if (error.status === 500) {
        navigate("/500");
      }
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      navigate("/login");
    },
    onError: (error: AuthError) => {
      console.error("Registration error:", error.message);

      // Check for specific HTTP status codes
      if (error.status === 500) {
        navigate("/500");
      }
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.clear();
    },
    onSettled: () => {
      // Use onSettled to ensure this runs whether success or error
      // Navigate after sign out completes
      navigate("/login", { replace: true });
    },
  });
};

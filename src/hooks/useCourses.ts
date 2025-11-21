import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { dollarsToCents } from "@/lib/priceUtils";
import type { CreateCourseInput, UpdateCourseInput } from "@/types/course";

export const useCourses = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  return { data, isLoading, error };
};

export const useCourse = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select()
        .eq("id", id)
        .single();

      if (error) {
        // Better error message for missing course
        if (error.code === 'PGRST116') {
          throw new Error(`Course not found with ID: ${id}`);
        }
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  return { data, isLoading, error };
};

export const useCreateCourse = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCourseInput & { owner_id: string }) => {
      // Convert price to cents before saving
      const courseData = {
        title: input.title.trim(),
        description: input.description.trim(),
        price: dollarsToCents(input.price),
        status: input.status,
        thumbnail_url: input.thumbnail_url.trim(),
        total_members: 0,
        owner_id: input.owner_id,
      };

      // TODO: Replace with actual Supabase table name when ready
      const { data, error } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate courses query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate("/courses");
    },
    onError: (error: Error & { status?: number }) => {
      console.error("Error creating course:", error.message);

      // Check for specific HTTP status codes
      if (error.status === 500) {
        navigate("/500");
      }
    },
  });
};

export const useUpdateCourse = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCourseInput) => {
      console.log("Updating course with ID:", courseId);
      console.log("Update input:", input);

      // Build update data, converting price if provided
      const updateData: Record<string, string | number> = {};

      if (input.title !== undefined) updateData.title = input.title.trim();
      if (input.description !== undefined) updateData.description = input.description.trim();
      if (input.price !== undefined) updateData.price = dollarsToCents(input.price);
      if (input.status !== undefined) updateData.status = input.status;
      if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url.trim();

      // Ensure we have something to update
      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      console.log("Update data being sent:", updateData);

      const { data, error } = await supabase
        .from("courses")
        .update(updateData)
        .eq("id", courseId)
        .select();

      console.log("Supabase response - data:", data, "error:", error);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("No rows returned. CourseId:", courseId);
        throw new Error("No course found with the given ID");
      }

      return data[0];
    },
    onSuccess: () => {
      // Invalidate both the courses list and the specific course
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
    onError: (error: Error) => {
      console.error("Error updating course:", error.message);
    },
  });
};

export const useArchiveCourse = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Check for active subscriptions first
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "active");

      if (subError) throw subError;

      if (subscriptions && subscriptions.length > 0) {
        throw new Error(
          `Cannot archive course with ${subscriptions.length} active subscriber${
            subscriptions.length !== 1 ? "s" : ""
          }. Please wait until all subscriptions expire or cancel them first.`
        );
      }

      // Archive the course
      const { data, error } = await supabase
        .from("courses")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
};

export const useDeleteCourse = (courseId: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Check for active subscriptions first
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "active");

      if (subError) throw subError;

      if (subscriptions && subscriptions.length > 0) {
        throw new Error(
          `Cannot delete course with ${subscriptions.length} active subscriber${
            subscriptions.length !== 1 ? "s" : ""
          }. Please archive the course instead.`
        );
      }

      // Delete the course
      const { error } = await supabase.from("courses").delete().eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate("/dashboard");
    },
  });
};

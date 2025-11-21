import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Lesson, CreateLessonInput } from "@/types/course";

export const useLessons = (courseId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select()
        .eq("course_id", courseId)
        .order("order", { ascending: true });

      if (error) {
        throw error;
      }

      return data as Lesson[];
    },
    enabled: !!courseId,
  });

  return { data, isLoading, error };
};

export const useLesson = (lessonId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select()
        .eq("id", lessonId)
        .single();

      if (error) {
        // Better error message for missing lesson
        if (error.code === 'PGRST116') {
          throw new Error(`Lesson not found with ID: ${lessonId}`);
        }
        throw error;
      }

      return data as Lesson;
    },
    enabled: !!lessonId,
  });

  return { data, isLoading, error };
};

export const useCreateLesson = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateLessonInput, "course_id">) => {
      const { data, error } = await supabase
        .from("lessons")
        .insert([
          {
            course_id: courseId,
            title: input.title,
            content: input.content || [],
            order: input.order,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Lesson;
    },
    onSuccess: () => {
      // Invalidate lessons query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
    },
    onError: (error: Error) => {
      console.error("Error creating lesson:", error.message);
    },
  });
};

export const useUpdateLesson = (lessonId: string, courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title?: string; content?: any }) => {
      const updateData: Record<string, any> = {};

      if (input.title !== undefined) updateData.title = input.title.trim();
      if (input.content !== undefined) updateData.content = input.content;

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      const { data, error } = await supabase
        .from("lessons")
        .update(updateData)
        .eq("id", lessonId)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("No lesson found with the given ID");
      }

      return data[0] as Lesson;
    },
    onSuccess: () => {
      // Invalidate both the lessons list and the specific lesson
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
    },
    onError: (error: Error) => {
      console.error("Error updating lesson:", error.message);
    },
  });
};

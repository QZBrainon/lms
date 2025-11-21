export interface Course {
  id: string;
  title: string;
  description: string;
  price: number; // Price stored in cents
  status: "draft" | "published";
  thumbnail_url: string;
  total_members: number;
  owner_id: string;
  created_at: string;
  archived_at: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "cancelled" | "expired" | "past_due";
  stripe_subscription_id: string;
  created_at: string;
  enrolled_at: string;
  ends_at: string | null;
  billing_cycle: string;
  cancel_at_period_end: boolean;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  price: number; // Price in dollars (will be converted to cents)
  status: "published" | "draft";
  thumbnail_url: string;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  price?: number; // Price in dollars (will be converted to cents)
  status?: "published" | "draft";
  thumbnail_url?: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: any; // BlockNote JSON content
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLessonInput {
  course_id: string;
  title: string;
  content?: any;
  order: number;
}

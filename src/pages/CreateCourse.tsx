import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCourse } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createCourseMutation = useCreateCourse();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    status: "draft" as "draft" | "published",
    thumbnail_url: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setThumbnailFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload thumbnail to Supabase Storage
  const uploadThumbnail = async (): Promise<string> => {
    if (!thumbnailFile || !user) {
      throw new Error("No file or user");
    }

    setIsUploading(true);

    try {
      // SUPABASE STORAGE STRATEGY:
      // 1. Create ONE bucket for all course thumbnails called "course-thumbnails"
      // 2. Organize files by user_id/course-id/filename.ext
      // 3. This keeps things organized without creating per-user buckets
      // 4. Make the bucket public so thumbnails can be accessed via URL

      // Generate unique filename to prevent collisions
      const fileExt = thumbnailFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      // SETUP REQUIRED:
      // 1. Go to Supabase Dashboard > Storage
      // 2. Create a new bucket called "course-thumbnails"
      // 3. Make it PUBLIC (so images are accessible via URL)
      // 4. Set up RLS policies:
      //    - Allow INSERT for authenticated users
      //    - Allow SELECT for everyone (public read)
      //    - Allow UPDATE/DELETE only for file owner (user_id matches)

      const { data, error } = await supabase.storage
        .from("course-thumbnails") // Bucket name
        .upload(fileName, thumbnailFile, {
          cacheControl: "3600",
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("course-thumbnails").getPublicUrl(data.path);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a course");
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a course description");
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!thumbnailFile) {
      toast.error("Please upload a course thumbnail");
      return;
    }

    try {
      // Upload thumbnail first
      toast.loading("Uploading thumbnail...");
      const thumbnailUrl = await uploadThumbnail();

      // Create course with uploaded thumbnail URL
      createCourseMutation.mutate({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price), // Hook will convert to cents
        status: formData.status,
        thumbnail_url: thumbnailUrl,
        owner_id: user.id,
      });

      toast.success("Course created successfully!");
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container max-w-3xl mx-auto py-8 px-4">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Course</h1>
          <p className="text-muted-foreground">
            Share your knowledge by creating a new course
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>
              Fill in the information about your course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Course Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={5}
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (USD) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-7"
                    value={formData.price}
                    onChange={(e) => {
                      // Only allow numbers and one decimal point
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setFormData({ ...formData, price: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Format to 2 decimal places on blur if there's a value
                      const value = e.target.value;
                      if (value && !isNaN(parseFloat(value))) {
                        const formatted = parseFloat(value).toFixed(2);
                        setFormData({ ...formData, price: formatted });
                      }
                    }}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set your course price. Use 0 for free courses.
                </p>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">
                  Course Thumbnail <span className="text-destructive">*</span>
                </Label>

                {/* Preview */}
                {thumbnailPreview && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Upload button */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("thumbnail")?.click()
                    }
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {thumbnailFile ? "Change Image" : "Upload Image"}
                  </Button>
                  {thumbnailFile && (
                    <span className="text-sm text-muted-foreground">
                      {thumbnailFile.name}
                    </span>
                  )}
                </div>

                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 16:9 ratio, max 10MB (JPG, PNG, or WebP)
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex gap-4"></div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createCourseMutation.isPending || isUploading}
                >
                  {createCourseMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isUploading ? "Uploading..." : "Creating..."}
                    </>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default CreateCourse;

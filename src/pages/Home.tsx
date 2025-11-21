import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header>
        <div className="container max-w-7xl mx-auto flex items-center justify-between py-6 px-4">
          <Link to="/" className="text-3xl font-bold">
            <span className="text-emerald-500/50">is</span>
            <span className="text-blue-500/50">C</span>
            <span className="text-red-500/50">o</span>
            <span className="text-yellow-500/50">o</span>
            <span className="text-red-500/50">l</span>
            <span>.</span>
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => logout()}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button className="cursor-pointer" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </header>
      {/* Main */}
      <main>
        {/* Hero */}
        <div className="container max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 mx-auto py-12 px-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-7xl leading-tight font-bold mb-4 relative">
              Create courses and{" "}
              <span className="text-emerald-500/90">monetize</span> your
              knowledge
            </h1>

            <p className="text-2xl leading-relaxed text-muted-foreground md:text-xl">
              We offer all the tools you need to create your own audience and a
              rich community.
            </p>
            <div className="flex gap-4">
              <Button className="cursor-pointer" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
              <Button className="cursor-pointer" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
          <div className="bg-linear-to-br from-emerald-500/20 to-blue-500/20 rounded-lg h-full md:h-auto flex items-center justify-center">
            <p className="text-muted-foreground">Hero Image / Video</p>
          </div>
        </div>

        {/* Features */}
        <div className="container max-w-7xl mx-auto py-24 px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              Everything you need to teach
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Powerful features to help you create and sell your courses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-4 p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold">Easy Course Creation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Build engaging courses with our intuitive course builder. No
                technical skills required.
              </p>
            </div>

            <div className="flex flex-col gap-4 p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold">Secure Payments</h3>
              <p className="text-muted-foreground leading-relaxed">
                Accept payments safely with integrated payment processing. Get
                paid instantly.
              </p>
            </div>

            <div className="flex flex-col gap-4 p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold">Student Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track student progress and engagement with detailed analytics
                and insights.
              </p>
            </div>

            <div className="flex flex-col gap-4 p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-2xl font-bold">Mobile Friendly</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your courses look great on any device. Students can learn
                anywhere, anytime.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-muted/50 py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Start earning from your knowledge in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <h3 className="text-3xl font-bold">Create</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Build your course with our easy-to-use tools. Add videos,
                  quizzes, and assignments.
                </p>
              </div>

              <div className="text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <h3 className="text-3xl font-bold">Publish</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Set your price and publish your course. Share it with your
                  audience.
                </p>
              </div>

              <div className="text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <h3 className="text-3xl font-bold">Earn</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Watch your income grow as students enroll and complete your
                  courses.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="container max-w-7xl mx-auto py-24 px-4">
          <div className="bg-linear-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-12 text-center">
            <h2 className="text-5xl font-bold mb-4">
              Ready to start teaching?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join thousands of instructors sharing their knowledge and earning
              from their expertise.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="cursor-pointer" asChild>
                <Link to="/register">Create Your Course</Link>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer" asChild>
                <Link to="/discover">Browse Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container max-w-7xl mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-2xl font-bold">
                <span className="text-emerald-500/50">is</span>
                <span className="text-blue-500/50">C</span>
                <span className="text-red-500/50">o</span>
                <span className="text-yellow-500/50">o</span>
                <span className="text-red-500/50">l</span>
                <span>.</span>
              </Link>
              <p className="text-muted-foreground">
                Create and share courses with the world.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-bold mb-2">Product</h4>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                FAQ
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-bold mb-2">Company</h4>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                About
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Blog
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Contact
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-bold mb-2">Legal</h4>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </a>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 isCool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

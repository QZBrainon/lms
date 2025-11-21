import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-emerald-500/50">404</h1>
          <div className="h-1 w-20 bg-emerald-500 mx-auto mb-8"></div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>

        <p className="text-lg text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for. The page might have been moved or deleted.
        </p>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="cursor-pointer">
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="cursor-pointer">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

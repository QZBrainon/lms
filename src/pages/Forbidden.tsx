import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-500/50">403</h1>
          <div className="h-1 w-20 bg-red-500 mx-auto mb-8"></div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Access Forbidden</h2>

        <p className="text-lg text-muted-foreground mb-8">
          You don't have permission to access this resource. If you believe this is an error, please contact support.
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

export default Forbidden;

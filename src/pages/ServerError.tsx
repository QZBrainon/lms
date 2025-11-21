import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

function ServerError() {
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-yellow-500/50">500</h1>
          <div className="h-1 w-20 bg-yellow-500 mx-auto mb-8"></div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Server Error</h2>

        <p className="text-lg text-muted-foreground mb-8">
          Something went wrong on our end. We're working to fix the issue. Please try again later.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={handleReload}
            size="lg"
            className="cursor-pointer"
          >
            Reload Page
          </Button>
          <Button
            onClick={handleGoBack}
            size="lg"
            variant="outline"
            className="cursor-pointer"
          >
            Go Back
          </Button>
          <Button asChild size="lg" variant="outline" className="cursor-pointer">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ServerError;

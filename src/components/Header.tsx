import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth, useLogout } from "@/hooks/useAuth";

function Header() {
  const { user } = useAuth();
  const { mutate: logout } = useLogout();

  return (
    <header className="border-b bg-background">
      <div className="container max-w-7xl mx-auto grid grid-cols-3 items-center py-4 px-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold">
            <span className="text-emerald-500/50">is</span>
            <span className="text-blue-500/50">C</span>
            <span className="text-red-500/50">o</span>
            <span className="text-yellow-500/50">o</span>
            <span className="text-red-500/50">l</span>
            <span>.</span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-1">
          <Button variant="ghost" asChild>
            <Link to="/discover">Discover</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/subscriptions">Subscriptions</Link>
          </Button>
        </nav>

        {/* Right: User Info */}
        <div className="flex items-center justify-end gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="cursor-pointer"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;

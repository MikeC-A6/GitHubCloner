import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Home from "./pages/Home";

// Import the logo
import logo from "./assets/agile6_logo_rgb (1).png";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="navbar">
        <div className="container flex justify-between items-center">
          <div className="logo-container">
            <img src={logo} alt="Agile Six Logo" className="logo" />
          </div>
          <div className="flex gap-6">
            <a href="/" className="nav-link">Home</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/contact" className="nav-link">Contact</a>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-agilesix-blue text-white py-8">
        <div className="container">
          <div className="flex justify-between items-center">
            <img src={logo} alt="Agile Six Logo" className="logo brightness-0 invert" />
            <p className="text-sm">&copy; {new Date().getFullYear()} Agile Six. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function NotFound() {
  return (
    <div className="container py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-agilesix-red" />
            <h1 className="heading-2">404 Page Not Found</h1>
          </div>
          <p className="text-body mt-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
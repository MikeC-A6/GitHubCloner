import { Card, CardContent } from "@/components/ui/card";
import RepositoryForm from "@/components/RepositoryForm";
import PatternManager from "@/components/PatternManager";
import { useState } from "react";

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);

  return (
    <div className="min-h-screen w-full p-6 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">
          GitHub Repository Analyzer
        </h1>

        <Card>
          <CardContent className="pt-6">
            <RepositoryForm 
              onAnalyzeStart={() => setAnalyzing(true)}
              onAnalyzeComplete={() => setAnalyzing(false)}
            />
          </CardContent>
        </Card>

        <PatternManager disabled={analyzing} />
      </div>
    </div>
  );
}
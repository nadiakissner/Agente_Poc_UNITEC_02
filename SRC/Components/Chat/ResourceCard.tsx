import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/Ui/card";
import { Button } from "@/Components/Ui/button";
import { ExternalLink } from "lucide-react";

interface ResourceCardProps {
  title: string;
  description: string;
  ctaText: string;
  onAction: () => void;
  icon?: React.ReactNode;
}

export function ResourceCard({ title, description, ctaText, onAction, icon }: ResourceCardProps) {
  return (
    <Card className="mb-4 border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {icon && <div className="text-primary mt-1">{icon}</div>}
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1 text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={onAction} className="w-full">
          {ctaText}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

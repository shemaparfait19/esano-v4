import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

type InsightCardProps = {
  icon: ReactNode;
  title: string;
  content: string | string[] | any;
};

export function InsightCard({ icon, title, content }: InsightCardProps) {
  // Handle different content types
  const renderContent = () => {
    if (!content) {
      return <p className="text-muted-foreground">No insights available</p>;
    }
    
    // If it's a string, display it
    if (typeof content === 'string') {
      return <p className="text-foreground/80 whitespace-pre-wrap">{content}</p>;
    }
    
    // If it's an array, display as list
    if (Array.isArray(content)) {
      if (content.length === 0) {
        return <p className="text-muted-foreground">No insights available</p>;
      }
      return (
        <ul className="space-y-2 text-foreground/80">
          {content.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    // If it's an object, try to extract meaningful data
    if (typeof content === 'object') {
      if (content.summary) {
        return <p className="text-foreground/80 whitespace-pre-wrap">{content.summary}</p>;
      }
      return <p className="text-foreground/80 whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</p>;
    }
    
    return <p className="text-muted-foreground">Invalid insight format</p>;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            {icon}
          </div>
          <CardTitle className="font-headline text-xl text-primary">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

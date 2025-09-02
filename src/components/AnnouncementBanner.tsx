import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useActiveAnnouncements } from '@/hooks/useAnnouncements';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const icons = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  danger: <XCircle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
};

const getColors = (type: string) => {
  switch (type) {
    case 'info':
      return 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900';
    case 'danger':
      return 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900';
    case 'success':
      return 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300 border-green-200 dark:border-green-900';
    default:
      return 'bg-muted text-foreground';
  }
};

export const AnnouncementBanner: React.FC = () => {
  const { data: announcements, isLoading, error } = useActiveAnnouncements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 bg-muted/50 border-b">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-2 p-2">
      {announcements.map((announcement) => (
        <Alert 
          key={announcement.id} 
          className={cn(getColors(announcement.type), "relative")}
        >
          <div className="flex items-start gap-2">
            {icons[announcement.type as keyof typeof icons]}
            <div className="flex-1">
              <AlertDescription className="pr-8">
                {announcement.message}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveTooltipProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
}

export const ResponsiveTooltip: React.FC<ResponsiveTooltipProps> = ({ trigger, content }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-auto p-4 text-sm max-w-[calc(100vw-2rem)]">{content}</PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
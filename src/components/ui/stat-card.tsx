
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils"
import { Skeleton } from './skeleton';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string | React.ReactNode;
  linkTo?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, icon: Icon, description, linkTo, isLoading }: StatCardProps) {
  
  const cardContent = (
    <Card className={cn(
      "shadow-md hover:shadow-lg transition-shadow", 
      linkTo && "hover:bg-muted/50 duration-200"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl lg:text-3xl font-bold font-headline">{value}</div>
        )}
        {isLoading ? (
            <Skeleton className="h-4 w-full mt-1" />
        ) : (
            description && <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="cursor-pointer">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

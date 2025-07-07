
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  linkTo?: string;
}

export function StatCard({ title, value, icon: Icon, description, linkTo }: StatCardProps) {
  const cardContent = (
    <Card className={cn(linkTo && "hover:bg-muted/50 transition-colors")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
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


"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Gamepad2, Ticket, CircleAlert, Users } from 'lucide-react';

const categories = [
  { name: 'Consoles', details: '8 active, 2 in maintenance', href: '/sessions', icon: Gamepad2, iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-500' },
  { name: 'Support Tickets', details: '15 open, 123 closed', href: '/support', icon: Ticket, iconBg: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-500' },
  { name: 'Error Logs', details: '1 active, 40 closed', href: '#', icon: CircleAlert, iconBg: 'bg-red-100 dark:bg-red-900/50', iconColor: 'text-red-500' },
  { name: 'Happy Customers', details: '+430 registered', href: '/customers', icon: Users, iconBg: 'bg-yellow-100 dark:bg-yellow-900/50', iconColor: 'text-yellow-500' },
];

export function CategoryList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((item) => (
            <Link href={item.href} key={item.name}>
              <div className="flex items-center p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer group">
                <div className={`p-2 rounded-full mr-4 ${item.iconBg}`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

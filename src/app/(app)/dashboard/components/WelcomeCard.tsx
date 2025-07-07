
"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WelcomeCard() {
  return (
    <Card className="relative overflow-hidden h-full flex flex-col justify-between bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg">
      <CardContent className="p-6 relative z-10">
        <div className="mb-4">
            <span className="inline-block bg-white text-gray-900 text-xs font-semibold px-2 py-1 rounded-full">New</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Get started with Infinity</h3>
        <p className="text-sm text-gray-300 mb-6">There's nothing I really wanted to do in life that I wasn't able to get good at.</p>
        <Button variant="outline" size="sm" className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900">
            Learn More
        </Button>
      </CardContent>
      <div className="absolute bottom-0 right-0 w-3/4 h-full">
          <Image
            src="https://placehold.co/400x400.png"
            alt="Abstract background"
            data-ai-hint="abstract illustration"
            fill
            className="object-contain object-right-bottom opacity-20"
          />
      </div>
    </Card>
  );
}

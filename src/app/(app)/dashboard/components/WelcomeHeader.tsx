
"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function WelcomeHeader() {
  // Initialize with null to avoid server/client mismatch for hydration
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set the initial date only on the client side after the component mounts
    setCurrentDateTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Cleanup the interval on component unmount
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Use a placeholder for user name for now
  const userName = "Admin";

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold tracking-tight">Welcome, {userName}!</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {/* Only render the formatted date when it's available on the client */}
        {currentDateTime ? format(currentDateTime, "EEEE, MMMM do, yyyy 'at' h:mm:ss a") : <>&nbsp;</>}
      </p>
    </div>
  );
}

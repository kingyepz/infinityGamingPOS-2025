
"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function WelcomeHeader() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Use a placeholder for user name for now
  const userName = "Admin";

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold font-headline">Welcome, {userName}!</h1>
      <p className="text-muted-foreground">
        {format(currentDateTime, "EEEE, MMMM do, yyyy 'at' h:mm:ss a")}
      </p>
    </div>
  );
}

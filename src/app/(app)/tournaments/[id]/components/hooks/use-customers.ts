"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/types';

export function useCustomers(searchTerm: string = '') {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchCustomers();
    } else if (searchTerm.length === 0) {
      // Show recent customers when no search term
      fetchRecentCustomers();
    } else {
      setCustomers([]);
      setIsLoading(false);
    }
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('customers')
        .select('*')
        .limit(10);

      if (searchTerm) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.order('full_name', { ascending: true });

      if (error) throw error;

      const formattedCustomers: Customer[] = data?.map((customer: any) => ({
        ...customer,
        join_date: customer.created_at, // Map for compatibility
      })) || [];

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedCustomers: Customer[] = data?.map((customer: any) => ({
        ...customer,
        join_date: customer.created_at, // Map for compatibility
      })) || [];

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Error fetching recent customers:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers,
  };
}
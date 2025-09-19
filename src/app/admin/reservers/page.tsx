'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Reservation } from '@/types';

type Reserver = {
  reserver_phone: string;
  reserver_name: string;
  reservation_count: number;
};

type ReservationDetail = Reservation & {
  room?: { name: string; location: string } | null;
};

export default function AdminReserversPage() {
  const { toast } = useToast();
  const [reservers, setReservers] = useState<Reserver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReserver, setSelectedReserver] = useState<Reserver | null>(null);
  const [details, setDetails] = useState<ReservationDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchReservers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reservers');
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to fetch reservers');
      }
      const { data } = await response.json();
      setReservers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservers();
  }, []);

  const handleViewDetails = async (reserver: Reserver) => {
    if (selectedReserver?.reserver_phone === reserver.reserver_phone) {
      setSelectedReserver(null);
      setDetails([]);
      return;
    }

    setSelectedReserver(reserver);
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/admin/reservers/${reserver.reserver_phone}`);
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to fetch details');
      }
      const { data } = await response.json();
      setDetails(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (phone: string, name: string, count: number) => {
    if (!window.confirm(`Are you sure you want to delete all ${count} reservations for ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reservers/${phone}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to delete');
      }
      toast({
        title: 'Success',
        description: 'All reservations for this user have been deleted.',
      });
      fetchReservers(); // Refresh the list
      setSelectedReserver(null);
      setDetails([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservers.map((reserver) => (
                  <TableRow
                    key={reserver.reserver_phone}
                    className={selectedReserver?.reserver_phone === reserver.reserver_phone ? 'bg-muted/50' : ''}
                  >
                    <TableCell>{reserver.reserver_name}</TableCell>
                    <TableCell>{reserver.reserver_phone}</TableCell>
                    <TableCell>{reserver.reservation_count}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(reserver)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:col-span-2">
            {selectedReserver && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Details for {selectedReserver.reserver_name} ({selectedReserver.reserver_phone})
                  </h2>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedReserver.reserver_phone, selectedReserver.reserver_name, selectedReserver.reservation_count)}
                  >
                    Delete All
                  </Button>
                </div>
                {detailsLoading ? (
                  <p>Loading details...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Room ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell>{res.reservation_date}</TableCell>
                          <TableCell>{res.start_time.slice(0,5)} - {res.end_time.slice(0,5)}</TableCell>
                          <TableCell>{res.room_id}</TableCell>
                          <TableCell>{res.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

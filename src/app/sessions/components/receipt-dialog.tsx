
"use client";

import type { GameSession } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Printer, Bot } from 'lucide-react';
import { BUSINESS_DETAILS, CURRENCY_SYMBOL, VAT_RATE } from '@/lib/constants';
import { format } from 'date-fns';
import React, { useRef } from 'react';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: GameSession;
}

export default function ReceiptDialog({ isOpen, onClose, session }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = receiptRef.current?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      // Create a new window or iframe for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Receipt</title>
              <style>
                body { font-family: 'Roboto', 'Source Code Pro', sans-serif; margin: 20px; color: #333; }
                .receipt-container { max-width: 300px; margin: auto; padding: 15px; border: 1px solid #eee; }
                .header { text-align: center; margin-bottom: 15px; }
                .header h1 { font-size: 1.4em; margin:0; font-family: 'Montserrat', sans-serif; }
                .header p { font-size: 0.8em; margin: 2px 0; }
                .item { display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 5px; }
                .item span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 10px; }
                .bold { font-weight: bold; }
                .total-section .item { font-size: 1em; }
                hr { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
                .footer { text-align: center; font-size: 0.8em; margin-top: 15px; }
                @media print {
                  body { margin: 0; }
                  .receipt-container { border: none; box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                ${printContents}
              </div>
              <script>
                setTimeout(() => { 
                  window.print();
                  window.close();
                }, 250); // Small delay for content to render
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback for browsers that block popups
        document.body.innerHTML = `<div class="receipt-container">${printContents}</div>`;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // to restore event listeners etc.
      }
    }
  };
  
  const DetailItem: React.FC<{ label: string; value: string | number | undefined; isBold?: boolean; className?: string }> = ({ label, value, isBold, className }) => (
    <div className={`item ${className || ''}`}>
      <span className={isBold ? 'bold' : ''}>{label}</span>
      <span className={isBold ? 'bold' : ''}>{value ?? '-'}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Receipt</DialogTitle>
          <DialogDescription>Transaction details for {session.customerName}.</DialogDescription>
        </DialogHeader>
        
        <div ref={receiptRef} className="py-4 text-sm font-code">
          <div className="header">
            <Bot className="h-10 w-10 mx-auto text-primary mb-2" />
            <h1>{BUSINESS_DETAILS.name}</h1>
            <p>{BUSINESS_DETAILS.address}</p>
            <p>Phone: {BUSINESS_DETAILS.phone}</p>
            <p>KRA PIN: {BUSINESS_DETAILS.kraPin}</p>
          </div>

          <hr />
          <DetailItem label="Date:" value={format(new Date(), 'PPpp')} />
          <DetailItem label="Receipt No:" value={session.id.slice(-8).toUpperCase()} />
          <hr />

          <p className="font-semibold my-1">Customer:</p>
          <DetailItem label="Name:" value={session.customerName} />
          {/* Add customer phone if available, would require fetching full customer object */}
          
          <hr />
          <p className="font-semibold my-1">Session Details:</p>
          <DetailItem label="Console:" value={session.consoleName} />
          <DetailItem label="Game:" value={session.gameName} />
          <DetailItem label="Start Time:" value={format(session.startTime, 'p')} />
          {session.endTime && <DetailItem label="End Time:" value={format(session.endTime, 'p')} />}
          {session.billingType === 'per-hour' && session.durationMinutes != null && (
            <DetailItem label="Duration:" value={`${session.durationMinutes} min`} />
          )}
          <DetailItem label="Rate:" value={`${CURRENCY_SYMBOL} ${session.rate} ${session.billingType === 'per-hour' ? '/hr' : ''}`} />

          <hr />
          <div className="total-section">
            <DetailItem label="Subtotal:" value={`${CURRENCY_SYMBOL} ${session.subtotalAmount?.toFixed(2) || '0.00'}`} />
            <DetailItem label={`VAT (${VAT_RATE * 100}%):`} value={`${CURRENCY_SYMBOL} ${session.vatAmount?.toFixed(2) || '0.00'}`} />
            <DetailItem label="Total Amount:" value={`${CURRENCY_SYMBOL} ${session.totalAmount?.toFixed(2) || '0.00'}`} isBold />
          </div>

          <hr />
          <DetailItem label="Payment Method:" value={session.paymentMethod?.toUpperCase()} />
          {session.paymentMethod === 'mpesa' && session.mpesaReference && (
            <DetailItem label="MPesa Ref:" value={session.mpesaReference} />
          )}
          <DetailItem label="Points Earned:" value={`${session.pointsAwarded || 0} pts`} />
          
          <div className="footer">
            <p>Thank you for gaming with us!</p>
            <p>Come back soon!</p>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

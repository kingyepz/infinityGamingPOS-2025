
"use client";

import type { Session } from '@/types';
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
import { Printer, Gamepad2 } from 'lucide-react';
import { BUSINESS_DETAILS, CURRENCY_SYMBOL } from '@/lib/constants';
import { format } from 'date-fns';
import React, { useRef } from 'react';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

export default function ReceiptDialog({ isOpen, onClose, session }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = receiptRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open('', '_blank', 'height=600,width=400');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Receipt - ${session.id.slice(-6)}</title>
            <style>
              body { 
                font-family: 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace; 
                margin: 0; 
                padding: 10px;
                font-size: 10pt; 
                line-height: 1.4;
                color: #000;
              }
              .receipt-container { max-width: 320px; margin: auto; }
              .header { text-align: center; margin-bottom: 10px; }
              .header .logo { font-size: 24px; margin-bottom: 5px; }
              .header h1 { font-size: 1.2em; margin:0; font-family: 'Montserrat', sans-serif; text-transform: uppercase;}
              .header p { font-size: 0.8em; margin: 1px 0; }
              .item { display: flex; justify-content: space-between; margin-bottom: 3px; }
              .item span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 5px; }
              .item span:last-child { text-align: right; }
              .bold { font-weight: bold; }
              .total-section .item { font-size: 1.05em; }
              hr { border: none; border-top: 1px dashed #555; margin: 8px 0; }
              .footer { text-align: center; font-size: 0.8em; margin-top: 10px; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0mm; }
                .receipt-container { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${printContents.replace(/class="/g, 'class="p-')} 
            </div>
            <script>
              setTimeout(() => { 
                window.print();
                setTimeout(() => { window.close(); }, 500);
              }, 250);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert("Popup blocked. Please allow popups for this site to print receipts.");
    }
  };
  
  const DetailItem: React.FC<{ label: string; value: string | number | undefined | null; isBold?: boolean; className?: string }> = ({ label, value, isBold, className }) => (
    <div className={`item ${className || ''}`}>
      <span className={`${isBold ? 'bold' : ''} pr-2`}>{label}</span>
      <span className={`${isBold ? 'bold' : ''} text-right`}>{value ?? '-'}</span>
    </div>
  );

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Session Receipt</DialogTitle>
          <DialogDescription>Transaction details for {session.customerName}.</DialogDescription>
        </DialogHeader>
        
        <div ref={receiptRef} className="py-4 text-xs font-code bg-white text-black">
          <div className="header p-header">
            <div className="p-logo"><Gamepad2 className="h-8 w-8 mx-auto text-primary mb-1" /></div>
            <h1 className="p-h1">{BUSINESS_DETAILS.name}</h1>
            <p className="p-p">{BUSINESS_DETAILS.address}</p>
            <p className="p-p">Phone: {BUSINESS_DETAILS.phone}</p>
            <p className="p-p">KRA PIN: {BUSINESS_DETAILS.kraPin}</p>
          </div>

          <hr className="p-hr" />
          <DetailItem label="Date:" value={format(new Date(), 'dd/MM/yy HH:mm')} />
          <DetailItem label="Receipt No:" value={session.id.slice(-8).toUpperCase()} />
          <hr className="p-hr" />

          <p className="font-semibold my-1 p-p">Customer:</p>
          <DetailItem label="Name:" value={session.customerName} />
          
          <hr className="p-hr" />
          <p className="font-semibold my-1 p-p">Session Details:</p>
          <DetailItem label="Station:" value={session.stationName} />
          <DetailItem label="Game:" value={session.game_name} />
          <DetailItem label="Start:" value={format(new Date(session.start_time), 'HH:mm')} />
          {session.end_time && <DetailItem label="End:" value={format(new Date(session.end_time), 'HH:mm')} />}
          {session.session_type === 'per-hour' && session.duration_minutes != null && (
            <DetailItem label="Duration:" value={`${session.duration_minutes} min`} />
          )}
          <DetailItem label="Rate:" value={`${CURRENCY_SYMBOL} ${session.rate} ${session.session_type === 'per-hour' ? '/hr' : '(Fixed)'}`} />

          <hr className="p-hr" />
          <div className="total-section p-total-section">
            <DetailItem label="Total Amount:" value={`${CURRENCY_SYMBOL} ${session.amount_charged?.toFixed(2) || '0.00'}`} isBold />
          </div>

          <hr className="p-hr" />
          <DetailItem label="Paid Via:" value={session.payment_method?.toUpperCase()} />
          {session.payment_method === 'mpesa' && session.mpesa_reference && (
            <DetailItem label="MPesa Ref:" value={session.mpesa_reference} />
          )}
          <DetailItem label="Points Earned:" value={`${session.points_earned || 0} pts`} />
          
          <div className="footer p-footer">
            <p className="p-p">Thank you for gaming with us!</p>
            <p className="p-p">Karibu Tena! (Welcome Again!)</p>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

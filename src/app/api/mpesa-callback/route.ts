
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    console.log("M-Pesa callback received.");
    const body = await req.json();

    // Log the full callback payload for debugging purposes
    console.log("Callback body:", JSON.stringify(body, null, 2));

    const stkCallback = body.Body.stkCallback;
    const resultCode = stkCallback.ResultCode;
    
    // Find the session ID from the AccountReference
    const metadata = stkCallback.CallbackMetadata?.Item;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    
    if (!checkoutRequestID) {
        console.error("Callback missing CheckoutRequestID.");
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" });
    }

    try {
        const supabase = createClient();

        // Let's find the session using the checkout request ID.
        // We need a way to store this ID when we initiate the request.
        // For now, let's assume we can't. We'll use this callback just to update a status.
        // A better approach is to store checkoutRequestID against the session ID in a temporary table or on the session itself.
        // For simplicity, we will assume we CAN'T get the session ID easily.
        // This is a placeholder for a more robust implementation.

        // --- IDEAL IMPLEMENTATION ---
        // 1. When you initiate STK push, you save the returned `CheckoutRequestID`
        //    to the `sessions` table row for that specific session.
        // 2. In this callback, you use the `CheckoutRequestID` to find the session.
        //    const { data: session, error } = await supabase.from('sessions').select('*').eq('mpesa_checkout_id', checkoutRequestID).single();
        
        // --- SIMPLIFIED (LESS ROBUST) IMPLEMENTATION ---
        // The client-side will poll for changes. This callback is more of a backup/logging mechanism.
        
        if (resultCode === 0) {
            // Payment was successful
            const mpesaRef = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
            
            // Here you would find the session and update it.
            // Since we can't reliably get the session ID here without modifying the table,
            // the client-side polling will handle the primary update.
            // This callback can be used for logging or as a backup update mechanism.

            console.log(`Successful payment. Ref: ${mpesaRef}. CheckoutID: ${checkoutRequestID}.`);
            // Example update (would require finding the session first):
            /*
            await supabase
                .from('sessions')
                .update({ 
                    payment_status: 'paid', 
                    mpesa_reference: mpesaRef,
                    end_time: new Date().toISOString() // Or use time from callback
                })
                .eq('mpesa_checkout_id', checkoutRequestID); 
            */

        } else {
            // Payment failed or was cancelled
            const resultDesc = stkCallback.ResultDesc;
            console.error(`Failed payment. Code: ${resultCode}, Desc: ${resultDesc}, CheckoutID: ${checkoutRequestID}`);
        }

        // Acknowledge receipt of the callback to Safaricom
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

    } catch (error) {
        console.error("Error processing M-Pesa callback:", error);
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed due to internal server error" }, { status: 500 });
    }
}

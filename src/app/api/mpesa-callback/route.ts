
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Optional: simple shared-secret check to reject spoofed callbacks
    const expected = process.env.MPESA_CALLBACK_SECRET;
    if (expected) {
        const provided = req.nextUrl.searchParams.get('secret');
        if (provided !== expected) {
            console.warn('Rejected M-Pesa callback: invalid secret');
            return NextResponse.json({ ResultCode: 1, ResultDesc: "Forbidden" }, { status: 403 });
        }
    }

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

        // Attempt to locate the session that initiated this STK push
        const { data: session, error: findError } = await supabase
            .from('sessions')
            .select('id, amount_charged')
            .eq('mpesa_checkout_id', checkoutRequestID)
            .single();

        if (findError) {
            console.warn('Callback: could not find session for CheckoutRequestID', checkoutRequestID, findError.message);
        }

        if (resultCode === 0) {
            // Payment was successful
            const mpesaRef = metadata?.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
            console.log(`Successful payment. Ref: ${mpesaRef}. CheckoutID: ${checkoutRequestID}.`);

            if (session) {
                const { error: updateError } = await supabase
                    .from('sessions')
                    .update({ payment_status: 'paid', mpesa_reference: mpesaRef || null })
                    .eq('id', session.id);
                if (updateError) {
                    console.error('Failed to update session as paid:', updateError.message);
                }
            }
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

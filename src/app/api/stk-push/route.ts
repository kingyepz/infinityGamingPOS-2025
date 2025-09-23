
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

// Helper function to get Daraja API token
async function getDarajaToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
        throw new Error("M-Pesa API credentials are not configured in .env file.");
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // The Daraja sandbox and production URLs are different.
    // Ensure you are using the correct one for your environment.
    const isSandbox = (process.env.MPESA_ENV || 'sandbox') === 'sandbox';
    const urlBase = isSandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';
    const url = `${urlBase}/oauth/v1/generate?grant_type=client_credentials`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            },
            // It's a good practice to use caching for the token
            next: { revalidate: 3500 } // Cache for just under an hour
        });
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error fetching Daraja token:", error);
        throw new Error("Could not connect to M-Pesa API to get token.");
    }
}

// Phone number formatter
function formatPhoneNumber(phone: string) {
    if (phone.startsWith('0')) {
        return `254${phone.substring(1)}`;
    }
    if (phone.startsWith('+')) {
        return phone.substring(1);
    }
    return phone; // Assume it's already in the correct format
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, phoneNumber, sessionId } = body;

        if (!amount || !phoneNumber || !sessionId) {
            return NextResponse.json({ error: 'Missing amount, phoneNumber, or sessionId' }, { status: 400 });
        }

        const token = await getDarajaToken();
        const formattedPhone = formatPhoneNumber(phoneNumber);
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`; // YYYYMMDDHHmmss

        const passkey = process.env.MPESA_PASSKEY!;
        const shortcode = process.env.MPESA_BUSINESS_SHORTCODE!;
        
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        
        const siteUrl = process.env.MPESA_CALLBACK_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
        if (!siteUrl) {
            throw new Error('Callback base URL not set. Configure MPESA_CALLBACK_URL or NEXT_PUBLIC_SITE_URL.');
        }
        const secret = process.env.MPESA_CALLBACK_SECRET;
        const callbackUrl = secret ? `${siteUrl.replace(/\/$/, '')}/api/mpesa-callback?secret=${encodeURIComponent(secret)}` : `${siteUrl.replace(/\/$/, '')}/api/mpesa-callback`;
        
        const stkPayload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
            Amount: Math.ceil(amount), // Amount must be an integer
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: sessionId.slice(0, 12), // Use session ID for reference
            TransactionDesc: `Payment for session ${sessionId.slice(0, 6)}`
        };

        const isSandbox = (process.env.MPESA_ENV || 'sandbox') === 'sandbox';
        const baseUrl = isSandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';
        const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(stkPayload)
        });

        const responseData = await response.json();

        if (!response.ok || (responseData.ResponseCode && responseData.ResponseCode !== '0')) {
            console.error('M-Pesa STK Push error:', responseData);
            throw new Error(responseData.errorMessage || 'M-Pesa request failed.');
        }

        // Persist CheckoutRequestID to match it on callback
        try {
            const checkoutId = responseData.CheckoutRequestID;
            if (checkoutId) {
                const { error: updateError } = await supabase
                    .from('sessions')
                    .update({ mpesa_checkout_id: checkoutId })
                    .eq('id', sessionId);
                if (updateError) {
                    console.warn('Failed to store mpesa_checkout_id on session:', updateError.message);
                }
            }
        } catch (e) {
            console.warn('Non-fatal: unable to persist CheckoutRequestID:', e);
        }

        return NextResponse.json({ success: true, message: 'STK push initiated.', data: responseData });

    } catch (error) {
        console.error("STK Push Handler Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

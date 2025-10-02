import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        // Process the webhook payload here
        console.log('Received webhook:', data);

        // Respond with a success message
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
}
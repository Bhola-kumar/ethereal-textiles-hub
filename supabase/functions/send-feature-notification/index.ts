import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeatureNotificationRequest {
  sellerEmail: string;
  sellerName: string;
  productName: string;
  status: "approved" | "rejected";
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sellerEmail, sellerName, productName, status, adminNotes }: FeatureNotificationRequest = await req.json();

    console.log(`Sending feature notification to ${sellerEmail} for product "${productName}" - Status: ${status}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const isApproved = status === "approved";
    const subject = isApproved 
      ? `🎉 Your product "${productName}" is now featured!`
      : `Feature request update for "${productName}"`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isApproved ? '🎉 Congratulations!' : '📋 Feature Request Update'}
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hello <strong>${sellerName || 'Seller'}</strong>,
          </p>
          
          ${isApproved ? `
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your product <strong>"${productName}"</strong> has been approved to be featured on our homepage! 
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your product will now be visible to all visitors in the Featured Products section, helping you reach more customers.
            </p>
          ` : `
            <p style="font-size: 16px; margin-bottom: 20px;">
              We've reviewed your request to feature <strong>"${productName}"</strong> on our homepage.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Unfortunately, we were unable to approve your request at this time.
            </p>
          `}
          
          ${adminNotes ? `
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; margin: 20px 0;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;"><strong>Admin Notes:</strong></p>
              <p style="font-size: 14px; margin: 0;">${adminNotes}</p>
            </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Thank you for being a valued seller on Gamchha Dukaan!
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            This is an automated notification from Gamchha Dukaan.
            <br>
            © ${new Date().getFullYear()} Gamchha Dukaan. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gamchha Dukaan <onboarding@resend.dev>",
        to: [sellerEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feature-notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
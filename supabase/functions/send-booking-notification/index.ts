import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  // ✅ CORS preflight
  if (req?.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  try {
    const { bookingData, type } = await req?.json();
    const RESEND_API_KEY = Deno?.env?.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log(`Processing ${type} email for ${bookingData?.email}`);

    let emailResponse;

    if (type === "customer_confirmation") {
      // Send confirmation email to customer
      const emailPayload = {
        from: "Raagdhara Academy <onboarding@resend.dev>",
        to: bookingData?.email,
        subject: "Consultation Booking Confirmed - Raagdhara Academy",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #2F2F2F; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #8B4513; color: #FDF5E6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #FDF5E6; padding: 30px; border-radius: 0 0 8px 8px; }
                .detail-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
                .label { font-weight: bold; color: #8B4513; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #8B4513; text-align: center; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎵 Consultation Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Dear ${bookingData?.studentName},</p>
                  <p>Thank you for booking a free consultation with Raagdhara Academy! We're excited to begin your musical journey.</p>
                  
                  <h3 style="color: #8B4513; margin-top: 25px;">Booking Details:</h3>
                  <div class="detail-row">
                    <span class="label">Student Name:</span> ${bookingData?.studentName}
                  </div>
                  <div class="detail-row">
                    <span class="label">Email:</span> ${bookingData?.email}
                  </div>
                  <div class="detail-row">
                    <span class="label">Phone:</span> ${bookingData?.countryCode} ${bookingData?.phone}
                  </div>
                  <div class="detail-row">
                    <span class="label">Age Group:</span> ${bookingData?.ageGroup}
                  </div>
                  <div class="detail-row">
                    <span class="label">Course:</span> ${bookingData?.course}
                  </div>
                  <div class="detail-row">
                    <span class="label">Experience Level:</span> ${bookingData?.experience}
                  </div>
                  ${bookingData?.goals ? `
                  <div class="detail-row">
                    <span class="label">Learning Goals:</span> ${bookingData?.goals}
                  </div>
                  ` : ''}
                  
                  <h3 style="color: #8B4513; margin-top: 25px;">What's Next?</h3>
                  <ul>
                    <li>You will receive a calendar invitation with the Google Meet link</li>
                    <li>Please be in a quiet environment with good internet connectivity</li>
                    <li>Have any questions ready about the course or learning approach</li>
                    <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
                  </ul>
                  
                  <div class="footer">
                    <p><strong>Raagdhara Academy</strong></p>
                    <p>Email: <a href="mailto:raagdharamusic@gmail.com" style="color: #d4af37; text-decoration: none;">raagdharamusic@gmail.com</a></p>
                    <p>We look forward to meeting you!</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
      };

      console.log('Sending customer email to:', bookingData?.email);
      
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify(emailPayload)
      });
    } else if (type === "admin_notification") {
      // Send notification email to admin
      const emailPayload = {
        from: "Raagdhara Academy <onboarding@resend.dev>",
        to: "raagdharamusic@gmail.com",
        subject: "🔔 New Consultation Booking Received",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #2F2F2F; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #8B4513; color: #FDF5E6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #FDF5E6; padding: 30px; border-radius: 0 0 8px 8px; }
                .detail-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
                .label { font-weight: bold; color: #8B4513; display: inline-block; width: 150px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 New Consultation Booking</h1>
                </div>
                <div class="content">
                  <p><strong>A new student has booked a consultation!</strong></p>
                  
                  <h3 style="color: #8B4513; margin-top: 25px;">Student Information:</h3>
                  <div class="detail-row">
                    <span class="label">Name:</span> ${bookingData?.studentName}
                  </div>
                  <div class="detail-row">
                    <span class="label">Email:</span> ${bookingData?.email}
                  </div>
                  <div class="detail-row">
                    <span class="label">Phone:</span> ${bookingData?.countryCode} ${bookingData?.phone}
                  </div>
                  <div class="detail-row">
                    <span class="label">Age Group:</span> ${bookingData?.ageGroup}
                  </div>
                  <div class="detail-row">
                    <span class="label">Course:</span> ${bookingData?.course}
                  </div>
                  <div class="detail-row">
                    <span class="label">Timezone:</span> ${bookingData?.timezone}
                  </div>
                  <div class="detail-row">
                    <span class="label">Experience:</span> ${bookingData?.experience}
                  </div>
                  ${bookingData?.goals ? `
                  <div class="detail-row">
                    <span class="label">Goals:</span> ${bookingData?.goals}
                  </div>
                  ` : ''}
                  ${bookingData?.hearAbout ? `
                  <div class="detail-row">
                    <span class="label">Heard About Us:</span> ${bookingData?.hearAbout}
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <span class="label">Booking Time:</span> ${new Date()?.toLocaleString()}
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
      };

      console.log('Sending admin notification to: raagdharamusic@gmail.com');
      
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify(emailPayload)
      });
    } else {
      throw new Error("Invalid email type specified");
    }

    if (!emailResponse?.ok) {
      const errorData = await emailResponse?.json();
      console.error('Resend API error:', errorData);
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const result = await emailResponse?.json();
    console.log(`${type} email sent successfully. Message ID:`, result?.id);

    return new Response(JSON.stringify({
      success: true,
      messageId: result.id,
      message: `${type} email sent successfully`
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
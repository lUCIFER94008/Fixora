import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpUser = process.env.EMAIL_SERVER_USER || process.env.SMTP_USER;
const smtpPass = process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || "no-reply@fixora.com";

function getTransporter(): nodemailer.Transporter {
  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP authentication credentials not configured in environment");
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendEmailOTP(email: string, otp: string, userName?: string): Promise<boolean> {
  const subject = "Verify your FIXORA account";
  const name = userName || "Driver";
  const logoUrl = "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png";
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #080808; color: #FFFFFF; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255, 212, 0, 0.15); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoUrl}" alt="FIXORA Logo" style="width: 64px; height: 64px; border-radius: 50%; border: 2px solid #FFD400; margin-bottom: 12px;" />
        <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; tracking-wider; margin: 0; text-transform: uppercase;">FIXORA</h1>
        <p style="color: #FFD400; font-size: 10px; font-weight: 600; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 2px;">Autonomous Hyper-Garage Platform</p>
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,.08); padding-top: 25px;">
        <p style="color: #FFFFFF; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #9A9A9A; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Welcome to the portal. To finalize your coordinates validation and initiate your credentials synchronization, input the 6-digit OTP code below inside your verification terminal:</p>
        <div style="background-color: #111111; padding: 25px; border-radius: 12px; border: 1px solid rgba(255,212,0,0.1); text-align: center; margin-bottom: 25px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
          <span style="color: #FFD400; font-size: 38px; font-weight: 800; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px;">${otp}</span>
        </div>
        <div style="background-color: rgba(255,212,0,0.03); border-left: 3px solid #FFD400; padding: 12px 16px; border-radius: 4px; margin-bottom: 30px;">
          <p style="color: #9A9A9A; font-size: 12px; margin: 0; line-height: 1.5;">
            ⏰ <strong>Expiry Notice:</strong> This validation code is highly sensitive and will expire in exactly <strong>5 minutes</strong>. If you did not trigger this request, please change your credentials immediately.
          </p>
        </div>
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,.08); padding-top: 20px; text-align: center;">
        <p style="color: #555555; font-size: 10px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Security Notice & Confidentiality Protocol</p>
        <p style="color: #444444; font-size: 10px; margin: 0; line-height: 1.4;">
          This message contains synchronized session variables. Do not forward or expose this code to third parties. FIXORA Support agents will never ask for your verification OTP.
        </p>
      </div>
    </div>
  `;

  console.log(`[EMAIL] Initiating OTP send process to: ${email}`);

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"FIXORA" <${emailFrom}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      text: `Hello ${name},\n\nYour FIXORA verification code is ${otp}\n\nThis code expires in 5 minutes.`,
    });
    return true;
  } catch (error: any) {
    console.error("[SMTP SERVER ERROR] Nodemailer sendEmailOTP error:", error.message || error);
    
    // Explicitly throw SMTP authentication errors
    if (error.code === 'EAUTH' || error.message.includes('Authentication') || error.message.includes('Username and Password')) {
      throw new Error("SMTP authentication failed");
    }
    
    throw new Error(error.message || "Failed to send email verification");
  }
}

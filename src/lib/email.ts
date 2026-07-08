import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.EMAIL_SERVER_PASSWORD;
  const secure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  // Debugging log: Whether EMAIL_SERVER_USER exists
  console.log(`[DEBUG] EMAIL_SERVER_USER exists: ${!!smtpUser}`);

  if (!smtpUser) {
    throw new Error("Missing EMAIL_SERVER_USER");
  }
  if (!smtpPass) {
    throw new Error("Missing EMAIL_SERVER_PASSWORD");
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Debugging log: Whether SMTP connection succeeds
  transporter.verify((error) => {
    if (error) {
      console.error("[DEBUG] SMTP connection succeeds: false. Reason:", error.message || error);
    } else {
      console.log("[DEBUG] SMTP connection succeeds: true");
    }
  });

  return transporter;
}

export async function sendEmailOTP(email: string, otp: string, userName?: string): Promise<boolean> {
  const subject = "Verify your FIXORA account";
  const name = userName || "Driver";
  const logoUrl = "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png";
  const emailFrom = process.env.EMAIL_FROM || "no-reply@fixora.com";

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
            ⏰ <strong>Expiry Notice:</strong> This validation code is highly sensitive and will expire in exactly <strong>10 minutes</strong>. If you did not trigger this request, please change your credentials immediately.
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
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${emailFrom}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      text: `Hello ${name},\n\nYour FIXORA verification code is ${otp}\n\nThis code expires in 10 minutes.`,
    });
    // Debugging log: Whether the email was sent successfully
    console.log(`[DEBUG] Email sent successfully to: ${email}`);
    return true;
  } catch (error: any) {
    console.error("[SMTP SERVER ERROR] Nodemailer sendEmailOTP error:", error);
    const errMsg = error.message || "";
    const errCode = error.code || "";

    if (errMsg === "Missing EMAIL_SERVER_USER" || errMsg === "Missing EMAIL_SERVER_PASSWORD") {
      throw error;
    }

    if (errCode === 'EAUTH' || errMsg.includes('Authentication') || errMsg.includes('Username and Password') || errMsg.includes('535')) {
      throw new Error("SMTP authentication failed");
    }

    throw new Error("Email could not be sent");
  }
}

// ───────────────────────────────────────────────────
// Password Reset Email
// ───────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string
): Promise<boolean> {
  const emailFrom = process.env.EMAIL_FROM || "no-reply@fixora.com";
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  const logoUrl = "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Reset Your FIXORA Password</title></head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#111111;border-radius:20px;border:1px solid rgba(255,212,0,0.18);box-shadow:0 8px 40px rgba(0,0,0,0.85);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#111111 0%,#1a1a00 100%);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(255,212,0,0.12);">
              <img src="${logoUrl}" alt="FIXORA" width="60" height="60" style="border-radius:50%;border:2px solid #FFD400;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;" />
              <h1 style="color:#FFFFFF;font-size:26px;font-weight:900;margin:0;letter-spacing:4px;text-transform:uppercase;">FIXORA</h1>
              <p style="color:#FFD400;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:6px 0 0 0;">Autonomous Hyper-Garage Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              <p style="color:#FFFFFF;font-size:15px;line-height:1.7;margin:0 0 8px 0;">Hello <strong style="color:#FFD400;">${userName}</strong>,</p>
              <p style="color:#9A9A9A;font-size:13px;line-height:1.8;margin:0 0 28px 0;">
                We received a request to reset the password associated with your FIXORA account. 
                If this was you, click the button below to securely reset your credentials.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;background-color:#FFD400;color:#000000;font-size:13px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:14px;letter-spacing:1.5px;text-transform:uppercase;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:rgba(255,212,0,0.04);border-left:3px solid #FFD400;padding:14px 18px;border-radius:6px;">
                    <p style="color:#9A9A9A;font-size:12px;margin:0;line-height:1.7;">
                      ⏰ <strong style="color:#FFD400;">Important:</strong> This reset link will expire in <strong style="color:#FFFFFF;">15 minutes</strong>.<br/>
                      If you did not request a password reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="color:#555555;font-size:11px;margin:0 0 4px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color:#FFD400;font-size:10px;word-break:break-all;margin:0;">${resetUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0A0A0A;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="color:#444444;font-size:10px;margin:0 0 4px 0;text-transform:uppercase;font-weight:700;letter-spacing:1px;">Security & Confidentiality Protocol</p>
              <p style="color:#333333;font-size:10px;margin:0;line-height:1.6;">
                FIXORA will never ask for your password via email. This link is single-use and expires automatically.<br/>
                &copy; ${new Date().getFullYear()} FIXORA. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  console.log(`[EMAIL] Sending password reset email to: ${email}`);

  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${emailFrom}>`,
      to: email,
      subject: "Reset Your FIXORA Password",
      html: htmlContent,
      text: `Hello ${userName},\n\nWe received a request to reset your FIXORA password.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nFIXORA Team`,
    });
    console.log(`[EMAIL] Password reset email sent successfully to: ${email}`);
    return true;
  } catch (error: any) {
    console.error("[SMTP ERROR] sendPasswordResetEmail error:", error);
    const errMsg = error.message || "";
    if (errMsg === "Missing EMAIL_SERVER_USER" || errMsg === "Missing EMAIL_SERVER_PASSWORD") {
      throw error;
    }
    throw new Error("Email could not be sent");
  }
}


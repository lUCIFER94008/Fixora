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

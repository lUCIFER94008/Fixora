import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || "no-reply@fixora.com";

let transporter: nodemailer.Transporter | null = null;

if (smtpUser && smtpPass && smtpUser !== "your_email@gmail.com" && smtpPass !== "your_app_password") {
  transporter = nodemailer.createTransport({
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
  const htmlContent = `
    <div style="font-family: sans-serif; background-color: #080808; color: #FFFFFF; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,.06);">
      <h2 style="color: #FFD400; font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">Verify your FIXORA account</h2>
      <p style="color: #FFFFFF; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Hello ${name},</p>
      <p style="color: #9A9A9A; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your FIXORA verification code is:</p>
      <div style="background-color: #111111; padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,.04); text-align: center; margin-bottom: 24px;">
        <span style="color: #FFD400; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px;">${otp}</span>
      </div>
      <p style="color: #9A9A9A; font-size: 12px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,.06); padding-top: 20px;">This code expires in 5 minutes.</p>
    </div>
  `;

  console.log(`[EMAIL] Initiating OTP send process to: ${email}`);

  if (!transporter) {
    console.log(`[EMAIL-SIMULATOR] SMTP not configured. OTP verification code '${otp}' sent to ${email}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"FIXORA" <${emailFrom}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      text: `Hello ${name},\n\nYour FIXORA verification code is\n\n${otp}\n\nThis code expires in 5 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("Nodemailer sendEmailOTP error:", error);
    console.log(`[EMAIL-SIMULATOR-FALLBACK] SMTP error occurred. Verification code: '${otp}' for ${email}`);
    return true;
  }
}

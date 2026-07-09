import nodemailer from "nodemailer";
import { User, Vehicle, Workshop, Complaint } from "@/models/Schemas";

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

// ───────────────────────────────────────────────────
// FIXORA Base HTML Email Template Generator
// ───────────────────────────────────────────────────
export function generateFixoraEmail(
  customerName: string,
  title: string,
  statusBadgeText: string,
  statusBadgeColor: string,
  bodyHtml: string,
  progressStepIndex: number // 0: Pending, 1: Accepted, 2: Inspection, 3: Repair, 4: Parts Required, 5: Completed, 6: Delivered, -1: Cancelled/None
): string {
  const logoUrl = "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png";
  const steps = ["Pending", "Accepted", "Inspection", "Repair", "Parts Req.", "Completed", "Delivered"];

  let progressHtml = "";
  if (progressStepIndex >= 0) {
    progressHtml = `
      <div style="margin: 25px 0; background-color: #111111; padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
        <p style="color: #9A9A9A; font-size: 10px; uppercase; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 1px;">Repair Progress Tracker</p>
        <div style="display: table; width: 100%; table-layout: fixed;">
          ${steps.map((step, idx) => {
            const isActive = idx === progressStepIndex;
            const isCompleted = idx < progressStepIndex;
            const color = isActive ? "#FFD400" : isCompleted ? "#7CFF7A" : "#444444";
            return `
              <div style="display: table-cell; text-align: center; font-size: 9px; color: ${color}; font-weight: ${isActive ? "bold" : "normal"};">
                <span style="font-size: 14px; display: block;">${isActive ? "🟡" : isCompleted ? "●" : "○"}</span>
                <span style="display: block; margin-top: 4px;">${step}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050505; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #111111; border-radius: 24px; border: 1px solid rgba(255, 212, 0, 0.15); box-shadow: 0 12px 48px rgba(0,0,0,0.9); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #111111 0%, #1c1c02 100%); padding: 30px 40px; text-align: center; border-bottom: 1px solid rgba(255, 212, 0, 0.1);">
              <img src="${logoUrl}" alt="FIXORA" width="56" height="56" style="border-radius: 50%; border: 2px solid #FFD400; margin-bottom: 10px; display: inline-block;" />
              <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: 3px; text-transform: uppercase;">FIXORA</h1>
              <p style="color: #FFD400; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">Autonomous Hyper-Garage Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 40px;">
              <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 10px 0;">Hello <strong>${customerName}</strong>,</p>
              
              <!-- Subject Heading -->
              <h2 style="color: #FFFFFF; font-size: 16px; font-weight: 800; margin: 15px 0; text-transform: uppercase; border-left: 3px solid #FFD400; padding-left: 10px;">
                ${title}
              </h2>

              <!-- Status Badge -->
              <div style="margin: 15px 0;">
                <span style="background-color: ${statusBadgeColor}20; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeColor}40; padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                  Status: ${statusBadgeText}
                </span>
              </div>

              ${bodyHtml}

              <!-- Progress bar index helper -->
              ${progressHtml}

              <!-- CTA / Dashboard redirection link -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/owner/dashboard" target="_blank" style="display: inline-block; background-color: #FFD400; color: #000000; font-size: 12px; font-weight: 800; text-decoration: none; padding: 14px 35px; border-radius: 12px; letter-spacing: 1.2px; text-transform: uppercase; transition: all 0.2s;">
                  Access Dashboard →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #090909; padding: 25px 40px; border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
              <p style="color: #444444; font-size: 9px; margin: 0 0 6px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Fixora Operations Core</p>
              <p style="color: #333333; font-size: 9px; margin: 0 0 15px 0; line-height: 1.5;">
                This automated coordinate notification is synchronized with MongoDB. If you have inquiries, reach support at <a href="mailto:support@fixora.com" style="color: #FFD400; text-decoration: none;">support@fixora.com</a>.<br/>
                &copy; ${new Date().getFullYear()} FIXORA. All rights reserved.
              </p>
              <div style="font-size: 10px;">
                <a href="#" style="color: #555555; text-decoration: none; margin: 0 8px;">Website</a>
                <a href="#" style="color: #555555; text-decoration: none; margin: 0 8px;">Twitter</a>
                <a href="#" style="color: #555555; text-decoration: none; margin: 0 8px;">Instagram</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ───────────────────────────────────────────────────
// Specialized Send Functions Wrapper
// ───────────────────────────────────────────────────
export async function sendRepairStatusEmail(
  email: string,
  customerName: string,
  status: string,
  complaint: any,
  vehicle: any,
  workshop: any,
  completionDate?: string,
  reason?: string
): Promise<boolean> {
  if (!email) {
    console.warn("[EMAIL WARNING] Customer email is missing. Skipping send.");
    return false;
  }

  const emailFrom = process.env.EMAIL_FROM || "no-reply@fixora.com";
  let subject = `FIXORA | Repair Status Updated`;
  let title = `Repair Status Updated`;
  let badgeColor = "#FFD400";
  let stepIndex = 0;
  let bodyHtml = "";

  switch (status) {
    case "Pending":
      subject = "FIXORA | Complaint Successfully Registered";
      title = "Complaint Successfully Registered";
      badgeColor = "#FFD400";
      stepIndex = 0;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Your vehicle complaint has been successfully registered on the platform.</p>
        <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
          <tr><td><strong>Complaint ID:</strong></td><td style="color: #FFF;">${complaint.complaintId || complaint._id}</td></tr>
          <tr><td><strong>Vehicle:</strong></td><td style="color: #FFF;">${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate})</td></tr>
          <tr><td><strong>Workshop:</strong></td><td style="color: #FFF;">${workshop?.name}</td></tr>
          <tr><td><strong>Issue:</strong></td><td style="color: #FFF;">${complaint.title}</td></tr>
        </table>
        <p style="color: #9A9A9A; line-height: 1.6; margin-top: 15px;">Your complaint is waiting for workshop approval.</p>
      `;
      break;

    case "Accepted":
      subject = "FIXORA | Complaint Accepted";
      title = "Complaint Accepted";
      badgeColor = "#7CFF7A";
      stepIndex = 1;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Great news! <strong>${workshop?.name}</strong> has accepted your complaint.</p>
        <p style="color: #9A9A9A; line-height: 1.6; margin-top: 10px;">Our technicians will begin inspecting your vehicle shortly. Monitor metrics via the dashboard link below.</p>
      `;
      break;

    case "Inspection":
      subject = "FIXORA | Vehicle Inspection Started";
      title = "Vehicle Inspection Started";
      badgeColor = "#38bdf8";
      stepIndex = 2;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Your vehicle inspection has started. Diagnostics scanners are reading fault logs.</p>
        <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
          <tr><td><strong>Workshop:</strong></td><td style="color: #FFF;">${workshop?.name}</td></tr>
          <tr><td><strong>Complaint:</strong></td><td style="color: #FFF;">${complaint.title}</td></tr>
          <tr><td><strong>Vehicle:</strong></td><td style="color: #FFF;">${vehicle?.make} ${vehicle?.model}</td></tr>
        </table>
      `;
      break;

    case "Repair Started":
    case "Repair":
      subject = "FIXORA | Repair Work Started";
      title = "Repair Work Started";
      badgeColor = "#f97316";
      stepIndex = 3;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Repair work has begun on your vehicle.</p>
        <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
          <tr><td><strong>Workshop:</strong></td><td style="color: #FFF;">${workshop?.name}</td></tr>
          <tr><td><strong>Vehicle:</strong></td><td style="color: #FFF;">${vehicle?.make} ${vehicle?.model}</td></tr>
          <tr><td><strong>Estimated Completion:</strong></td><td style="color: #FFD400; font-weight: bold;">${completionDate || "1 Day"}</td></tr>
        </table>
      `;
      break;

    case "Waiting Parts":
    case "Parts Required":
      subject = "FIXORA | Waiting for Replacement Parts";
      title = "Waiting for Replacement Parts";
      badgeColor = "#a855f7";
      stepIndex = 4;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Your repair is temporarily paused.</p>
        <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
          <tr><td><strong>Reason:</strong></td><td style="color: #FFF;">Replacement parts are being arranged.</td></tr>
          <tr><td><strong>Detail:</strong></td><td style="color: #FFF;">${reason || "Waiting for components shipment."}</td></tr>
        </table>
        <p style="color: #9A9A9A; line-height: 1.6; margin-top: 15px;">We'll notify you immediately once repair work resumes.</p>
      `;
      break;

    case "Completed":
      subject = "FIXORA | Repair Completed Successfully";
      title = "Repair Completed Successfully";
      badgeColor = "#10b981";
      stepIndex = 5;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Congratulations! Your vehicle repair has been successfully completed.</p>
        <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
          <tr><td><strong>Workshop:</strong></td><td style="color: #FFF;">${workshop?.name}</td></tr>
          <tr><td><strong>Vehicle:</strong></td><td style="color: #FFF;">${vehicle?.make} ${vehicle?.model}</td></tr>
          <tr><td><strong>Repair Details:</strong></td><td style="color: #FFF;">${complaint.title}</td></tr>
        </table>
        <p style="color: #9A9A9A; line-height: 1.6; margin-top: 15px;">Please schedule pickup or wait for delivery. View the details below.</p>
      `;
      break;

    case "Delivered":
      subject = "FIXORA | Vehicle Delivered";
      title = "Vehicle Delivered";
      badgeColor = "#6366f1";
      stepIndex = 6;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Your vehicle has been delivered. Thank you for choosing FIXORA.</p>
        <p style="color: #9A9A9A; line-height: 1.6;">Please take a moment to rate your experience with ${workshop?.name}.</p>
      `;
      break;

    case "Cancelled":
      subject = "FIXORA | Complaint Cancelled";
      title = "Complaint Cancelled";
      badgeColor = "#ef4444";
      stepIndex = -1;
      bodyHtml = `
        <p style="color: #9A9A9A; line-height: 1.6;">Your registered vehicle complaint has been cancelled.</p>
        <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
          <tr><td><strong>Reason:</strong></td><td style="color: #FF5959; font-weight: bold;">${reason || "Cancelled by workshop owner."}</td></tr>
        </table>
        <p style="color: #9A9A9A; line-height: 1.6; margin-top: 15px;">If this was unexpected, please contact the workshop directly at ${workshop?.phone || ""}.</p>
      `;
      break;

    default:
      stepIndex = 0;
      bodyHtml = `<p style="color: #9A9A9A;">Repair status changed to: ${status}</p>`;
  }

  const html = generateFixoraEmail(customerName, title, status, badgeColor, bodyHtml, stepIndex);

  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${emailFrom}>`,
      to: email,
      subject: subject,
      html: html,
      text: `${title}\nStatus: ${status}\n\nAccess dashboard: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}`
    });
    console.log(`[EMAIL SUCCESS] Repair status update email sent to: ${email}`);
    return true;
  } catch (error: any) {
    console.error("[EMAIL SMTP ERROR] Failed to send repair status email:", error);
    return false;
  }
}

export async function sendRegistrationEmail(email: string, name: string): Promise<boolean> {
  const html = generateFixoraEmail(
    name,
    "Welcome to FIXORA!",
    "Registration Successful",
    "#7CFF7A",
    `<p style="color: #9A9A9A; line-height: 1.6;">Your FIXORA account has been successfully registered. You can now login, add vehicles, and coordinate diagnostic scans.</p>`,
    -1
  );
  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${process.env.EMAIL_FROM || "no-reply@fixora.com"}>`,
      to: email,
      subject: "Welcome to FIXORA | Registration Successful",
      html
    });
    return true;
  } catch (err) {
    console.error("sendRegistrationEmail error:", err);
    return false;
  }
}

export async function sendPremiumActivationEmail(email: string, name: string, paymentId: string): Promise<boolean> {
  const html = generateFixoraEmail(
    name,
    "Premium Subscription Activated!",
    "Premium Active",
    "#FFD400",
    `
      <p style="color: #9A9A9A; line-height: 1.6;">Thank you for your payment. Your Premium account is now active!</p>
      <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
        <tr><td><strong>Plan:</strong></td><td style="color: #FFD400; font-weight: bold;">⭐ PREMIUM UNLIMITED</td></tr>
        <tr><td><strong>Transaction ID:</strong></td><td style="color: #FFF;">${paymentId}</td></tr>
        <tr><td><strong>Features:</strong></td><td style="color: #FFF;">Unlimited Vehicles & Unlimited AI Diagnostics scans.</td></tr>
      </table>
    `,
    -1
  );
  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${process.env.EMAIL_FROM || "no-reply@fixora.com"}>`,
      to: email,
      subject: "FIXORA | Premium Subscription Activated",
      html
    });
    return true;
  } catch (err) {
    console.error("sendPremiumActivationEmail error:", err);
    return false;
  }
}

export async function sendBookingEmail(
  email: string,
  name: string,
  booking: any,
  type: "confirmation" | "cancelled" | "reminder"
): Promise<boolean> {
  let subject = "FIXORA | Booking Update";
  let title = "Booking Update";
  let badgeText = "Confirmed";
  let badgeColor = "#7CFF7A";
  let textHtml = "";

  if (type === "confirmation") {
    subject = "FIXORA | Booking Confirmed";
    title = "Booking Confirmation Details";
    badgeText = "Confirmed";
    badgeColor = "#7CFF7A";
    textHtml = `<p style="color: #9A9A9A; line-height: 1.6;">Your booking slot has been successfully scheduled with <strong>${booking.workshopName}</strong>.</p>`;
  } else if (type === "cancelled") {
    subject = "FIXORA | Booking Cancelled";
    title = "Booking Cancellation Alert";
    badgeText = "Cancelled";
    badgeColor = "#FF5959";
    textHtml = `<p style="color: #FF5959; line-height: 1.6;">Your scheduled service slot has been cancelled.</p>`;
  } else {
    subject = "FIXORA | Booking Reminder";
    title = "Booking Reminder Notice";
    badgeText = "Reminder";
    badgeColor = "#FFD400";
    textHtml = `<p style="color: #9A9A9A; line-height: 1.6;">This is a friendly reminder for your upcoming service slot.</p>`;
  }

  const html = generateFixoraEmail(
    name,
    title,
    badgeText,
    badgeColor,
    `
      ${textHtml}
      <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
        <tr><td><strong>Booking ID:</strong></td><td style="color: #FFF;">${booking.bookingId}</td></tr>
        <tr><td><strong>Vehicle:</strong></td><td style="color: #FFF;">${booking.vehicleName}</td></tr>
        <tr><td><strong>Workshop:</strong></td><td style="color: #FFF;">${booking.workshopName}</td></tr>
        <tr><td><strong>Date:</strong></td><td style="color: #FFF;">${booking.preferredDate}</td></tr>
        <tr><td><strong>Time:</strong></td><td style="color: #FFF;">${booking.preferredTime}</td></tr>
      </table>
    `,
    -1
  );

  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${process.env.EMAIL_FROM || "no-reply@fixora.com"}>`,
      to: email,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error("sendBookingEmail error:", err);
    return false;
  }
}

export async function sendInvoiceEmail(email: string, name: string, invoice: any, complaint: any): Promise<boolean> {
  const html = generateFixoraEmail(
    name,
    "Invoice Generated Successfully",
    "Invoice Unpaid",
    "#FFD400",
    `
      <p style="color: #9A9A9A; line-height: 1.6;">An invoice has been generated for your recent vehicle repair.</p>
      <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
        <tr><td><strong>Complaint Ref:</strong></td><td style="color: #FFF;">${complaint.title}</td></tr>
        <tr><td><strong>Total Amount:</strong></td><td style="color: #FFD400; font-weight: bold;">₹${invoice.total.toLocaleString()}</td></tr>
        <tr><td><strong>Status:</strong></td><td style="color: #FFF;">${invoice.status}</td></tr>
      </table>
      <p style="color: #9A9A9A; line-height: 1.6; margin-top: 15px;">Please login and complete payment via Razorpay checkout inside your settlements panel.</p>
    `,
    -1
  );
  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${process.env.EMAIL_FROM || "no-reply@fixora.com"}>`,
      to: email,
      subject: "FIXORA | New Invoice Generated",
      html
    });
    return true;
  } catch (err) {
    console.error("sendInvoiceEmail error:", err);
    return false;
  }
}

export async function sendAIDiagnosticEmail(email: string, name: string, complaint: any): Promise<boolean> {
  const diag = complaint.ai_diagnostics || {};
  const html = generateFixoraEmail(
    name,
    "AI Neural Scan Diagnostics Ready",
    "Diagnostics Scan Complete",
    "#38bdf8",
    `
      <p style="color: #9A9A9A; line-height: 1.6;">The AI Neural scanner has finished compiling telemetry fault classifications.</p>
      <table role="presentation" width="100%" style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #9A9A9A; font-size: 12px;">
        <tr><td><strong>Detected fault:</strong></td><td style="color: #FF5959; font-weight: bold;">${diag.category || "EV Powertrain System Fault"}</td></tr>
        <tr><td><strong>Severity:</strong></td><td style="color: #FF5959; font-weight: bold;">${diag.severity || "Critical"}</td></tr>
        <tr><td><strong>Recommendation:</strong></td><td style="color: #FFF;">${diag.recommended_action || "Calibrate battery modules."}</td></tr>
        <tr><td><strong>Confidence:</strong></td><td style="color: #FFD400;">${diag.confidence_score ? `${diag.confidence_score}%` : "94%"}</td></tr>
      </table>
    `,
    -1
  );
  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${process.env.EMAIL_FROM || "no-reply@fixora.com"}>`,
      to: email,
      subject: "FIXORA | AI Diagnostic Scan Report Ready",
      html
    });
    return true;
  } catch (err) {
    console.error("sendAIDiagnosticEmail error:", err);
    return false;
  }
}

export async function sendChatReplyOfflineEmail(email: string, name: string, messageText: string): Promise<boolean> {
  const html = generateFixoraEmail(
    name,
    "New Chat Reply Received",
    "Offline Reply Received",
    "#FFD400",
    `
      <p style="color: #9A9A9A; line-height: 1.6;">You have received a new offline message from your workshop coordinator.</p>
      <div style="background-color: #151515; padding: 16px; border-radius: 12px; margin-top: 15px; text-align: left; color: #FFF; font-style: italic; border-left: 3px solid #FFD400;">
        "${messageText}"
      </div>
      <p style="color: #9A9A9A; line-height: 1.6; margin-top: 15px;">Login to the chat dashboard to send an instant response.</p>
    `,
    -1
  );
  try {
    const activeTransporter = getTransporter();
    await activeTransporter.sendMail({
      from: `"FIXORA" <${process.env.EMAIL_FROM || "no-reply@fixora.com"}>`,
      to: email,
      subject: "FIXORA | New Message Offline Alert",
      html
    });
    return true;
  } catch (err) {
    console.error("sendChatReplyOfflineEmail error:", err);
    return false;
  }
}

export async function triggerStatusNotification(
  complaintId: string,
  status: string,
  reason?: string
): Promise<string> {
  try {
    const comp = await Complaint.findById(complaintId);
    if (!comp) {
      console.warn(`[STATUS EMAIL WARNING] Complaint ${complaintId} not found.`);
      return "Email Failed";
    }

    const owner = await User.findById(comp.owner_id);
    if (!owner) {
      console.warn(`[STATUS EMAIL WARNING] Owner not found for complaint ${complaintId}.`);
      return "Email Failed";
    }

    const vehicle = await Vehicle.findById(comp.vehicle_id);
    const wsOwner = await User.findById(comp.workshop_id);
    let workshop = await Workshop.findOne({ owner_id: comp.workshop_id });

    if (!workshop && wsOwner) {
      workshop = {
        name: wsOwner.name,
        phone: wsOwner.phone,
        address: "Fixora Network Partner",
        email: wsOwner.email
      } as any;
    }

    const emailSent = await sendRepairStatusEmail(
      owner.email,
      owner.name,
      status,
      comp,
      vehicle,
      workshop,
      comp.estimated_completion,
      reason
    );

    return emailSent ? "Email Sent Successfully" : "Email Failed";
  } catch (err) {
    console.error("[STATUS EMAIL ERROR] triggerStatusNotification error:", err);
    return "Email Failed";
  }
}


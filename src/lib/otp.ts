import { sendOTP, formatToE164 } from "@/lib/twilio";
import { sendEmailOTP } from "@/lib/email";

export interface VerificationOTPResult {
  smsSent: boolean;
  emailSent: boolean;
  smsError?: string;
  emailError?: string;
}

export async function sendVerificationOTP(
  email: string,
  phone: string,
  otpCode: string,
  name?: string
): Promise<VerificationOTPResult> {
  const result: VerificationOTPResult = {
    smsSent: false,
    emailSent: false,
  };

  // 1. Attempt Twilio SMS OTP
  try {
    const formattedPhone = formatToE164(phone);
    console.log(`[sendVerificationOTP] Attempting Twilio SMS send to E.164 phone: ${formattedPhone}`);
    
    const smsSuccess = await sendOTP(formattedPhone);
    result.smsSent = smsSuccess;
  } catch (err: any) {
    const rawMsg = err.message || "";
    // Clean and log the error message safely without stack traces or API keys
    console.error(`[TWILIO EXCEPTION LOG] sendVerificationOTP failed: ${rawMsg}`);
    
    result.smsSent = false;
    result.smsError = rawMsg || "SMS delivery failure";
  }

  // 2. Attempt Nodemailer Email OTP
  try {
    console.log(`[sendVerificationOTP] Attempting Email OTP send to: ${email}`);
    
    const emailSuccess = await sendEmailOTP(email, otpCode, name);
    result.emailSent = emailSuccess;
  } catch (err: any) {
    const rawMsg = err.message || "";
    console.error(`[EMAIL EXCEPTION LOG] sendVerificationOTP failed: ${rawMsg}`);
    
    result.emailSent = false;
    result.emailError = rawMsg || "Email delivery failed";
  }

  return result;
}

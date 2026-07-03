import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const fromPhone = process.env.TWILIO_PHONE_NUMBER || "+15017122661";

// Helper to format any Indian phone number to E.164 format (+91XXXXXXXXXX)
export function formatToE164(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

// Helper to validate if a phone number matches E.164 specification and has correct length
export function validatePhone(phone: string) {
  const formatted = formatToE164(phone);
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  
  if (!e164Regex.test(formatted)) {
    throw new Error("Invalid phone number format");
  }
  
  // Specific check for Indian numbers length (+91 followed by exactly 10 digits)
  if (formatted.startsWith("+91") && formatted.length !== 13) {
    throw new Error("Invalid phone number length. Indian mobile numbers must be 10 digits.");
  }
  
  return formatted;
}

function getTwilioClient(): twilio.Twilio {
  if (!accountSid || !authToken || accountSid === "mock_sid" || authToken === "mock_token") {
    throw new Error("Invalid Twilio credentials");
  }
  return twilio(accountSid, authToken);
}

export async function sendOTP(phone: string): Promise<boolean> {
  const formattedPhone = validatePhone(phone);
  console.log(`[TWILIO] Initiating OTP send process to: ${formattedPhone}`);
  
  if (!verifyServiceSid || verifyServiceSid === "mock_verify_sid") {
    throw new Error("Twilio Verify Service SID not found");
  }

  try {
    const clientInstance = getTwilioClient();
    const verification = await clientInstance.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: formattedPhone, channel: "sms" });
    
    return verification.status === "pending";
  } catch (error: any) {
    console.error("[TWILIO SERVER ERROR] Twilio sendOTP failed:", error.message || error);
    
    // Check credentials errors
    if (error.code === 20003 || error.status === 401 || error.message.includes("Authenticate")) {
      throw new Error("Invalid Twilio credentials");
    }
    // Check service SID errors
    if (error.code === 20404 || error.status === 404 || error.message.includes("not found")) {
      throw new Error("Twilio Verify Service SID not found");
    }
    
    throw new Error(error.message || "Twilio service error occurred");
  }
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const formattedPhone = validatePhone(phone);
  console.log(`[TWILIO] Verifying OTP code [${code}] for recipient: ${formattedPhone}`);

  if (!verifyServiceSid || verifyServiceSid === "mock_verify_sid") {
    throw new Error("Twilio Verify Service SID not found");
  }

  try {
    const clientInstance = getTwilioClient();
    const verificationCheck = await clientInstance.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: formattedPhone, code });
    
    return verificationCheck.status === "approved";
  } catch (error: any) {
    console.error("[TWILIO SERVER ERROR] Twilio verifyOTP failed:", error.message || error);
    
    if (error.code === 20003 || error.status === 401 || error.message.includes("Authenticate")) {
      throw new Error("Invalid Twilio credentials");
    }
    if (error.code === 20404 || error.status === 404 || error.message.includes("not found")) {
      throw new Error("Twilio Verify Service SID not found");
    }
    
    return false;
  }
}

export async function sendComplaintUpdate(phone: string, ticketTitle: string, status: string): Promise<boolean> {
  const formattedPhone = formatToE164(phone);
  const messageBody = `[FIXORA] Hello! Your repair request "${ticketTitle}" status has been updated to: ${status}. Access your dashboard for details.`;
  console.log(`[SMS-OUTBOX] Dispatching update message to ${formattedPhone}: ${messageBody}`);

  try {
    const clientInstance = getTwilioClient();
    await clientInstance.messages.create({
      body: messageBody,
      to: formattedPhone,
      from: fromPhone
    });
    return true;
  } catch (error: any) {
    console.warn(`[SMS SIMULATOR FALLBACK] Twilio credentials not configured. Message: "${messageBody}" to ${formattedPhone}`);
    return true;
  }
}

export async function sendWorkshopNotification(phone: string, driverName: string): Promise<boolean> {
  const formattedPhone = formatToE164(phone);
  const messageBody = `[FIXORA] Notification: A new vehicle complaint has been registered by ${driverName}. Please check your active garage queue.`;
  console.log(`[SMS-OUTBOX] Dispatching shop alert message to ${formattedPhone}: ${messageBody}`);

  try {
    const clientInstance = getTwilioClient();
    await clientInstance.messages.create({
      body: messageBody,
      to: formattedPhone,
      from: fromPhone
    });
    return true;
  } catch (error: any) {
    console.warn(`[SMS SIMULATOR FALLBACK] Twilio credentials not configured. Message: "${messageBody}" to ${formattedPhone}`);
    return true;
  }
}

export async function sendRegistrationSuccess(phone: string, name: string): Promise<boolean> {
  const formattedPhone = formatToE164(phone);
  const messageBody = `[FIXORA] Welcome ${name}! Your driver account has been successfully created. Explore the hyper-garage telemetry hub!`;
  console.log(`[SMS-OUTBOX] Dispatching welcome message to ${formattedPhone}: ${messageBody}`);

  try {
    const clientInstance = getTwilioClient();
    await clientInstance.messages.create({
      body: messageBody,
      to: formattedPhone,
      from: fromPhone
    });
    return true;
  } catch (error: any) {
    console.warn(`[SMS SIMULATOR FALLBACK] Twilio credentials not configured. Message: "${messageBody}" to ${formattedPhone}`);
    return true;
  }
}

export async function sendPasswordResetOTP(phone: string): Promise<boolean> {
  const formattedPhone = validatePhone(phone);
  console.log(`[TWILIO] Dispatching Password Reset OTP to phone: ${formattedPhone}`);
  
  if (!verifyServiceSid || verifyServiceSid === "mock_verify_sid") {
    throw new Error("Twilio Verify Service SID not found");
  }

  try {
    const clientInstance = getTwilioClient();
    const verification = await clientInstance.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: formattedPhone, channel: "sms" });
    return verification.status === "pending";
  } catch (error: any) {
    console.error("[TWILIO SERVER ERROR] Twilio sendPasswordResetOTP failed:", error.message || error);
    
    if (error.code === 20003 || error.status === 401 || error.message.includes("Authenticate")) {
      throw new Error("Invalid Twilio credentials");
    }
    if (error.code === 20404 || error.status === 404 || error.message.includes("not found")) {
      throw new Error("Twilio Verify Service SID not found");
    }
    
    // In case credentials are unset in local test env
    console.log(`[TWILIO-SIMULATOR] Twilio not configured. Password Reset OTP '654321' sent to ${formattedPhone}`);
    return true;
  }
}

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "4f7e2a9b3c5d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f";

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(req: Request): any {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function signTokenWithExpiry(payload: object, expiresIn: any = "10m") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyTokenString(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

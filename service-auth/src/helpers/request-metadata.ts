import { Context } from 'hono';
import { UAParser } from 'ua-parser-js';

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
  deviceType: string;
}

/**
 * Extracts metadata from the request, including IP address, User Agent, and Device Type.
 * Handles various proxy headers to find the real client IP.
 */
export const getRequestMetadata = (c: Context): RequestMetadata => {
  // 1. Determine IP Address
  // Prioritize standard proxy headers
  const forwardedFor = c.req.header('x-forwarded-for');
  const cfConnectingIp = c.req.header('cf-connecting-ip');
  const xRealIp = c.req.header('x-real-ip');
  const trueClientIp = c.req.header('true-client-ip'); // Akamai/Cloudflare often use this

  let ipAddress = 'unknown';

  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs. The first one is the client.
    ipAddress = forwardedFor.split(',')[0].trim();
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp.trim();
  } else if (trueClientIp) {
    ipAddress = trueClientIp.trim();
  } else if (xRealIp) {
    ipAddress = xRealIp.trim();
  }

  // Fallback if no headers found (e.g., direct connection in dev)
  // Note: Hono's c.req.raw might not expose socket info directly in all environments (like Cloudflare Workers),
  // but for Node/Bun, it often requires bindings. We default to 'unknown' or localhost if testing.
  if (ipAddress === 'unknown' && process.env.NODE_ENV === 'development') {
    ipAddress = '127.0.0.1';
  }

  // 2. Parse User Agent & Device Type
  const userAgentString = c.req.header('user-agent') || 'unknown';
  const parser = new UAParser(userAgentString);
  const deviceType = parser.getDevice().type || 'desktop'; // UAParser returns undefined for desktop usually

  return {
    ipAddress,
    userAgent: userAgentString,
    deviceType,
  };
};

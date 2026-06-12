declare namespace Express {
  interface Request {
    userId?: string;
    emailVerified?: boolean;
    requestId?: string;
  }
}

declare namespace Express {
  export interface Request {
    user?: { id: string; userId: string; email: string; fcm_token: string };
    rawBody: any;
  }
}

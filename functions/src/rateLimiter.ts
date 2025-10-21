import * as admin from 'firebase-admin';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number; 
  blockDurationMs?: number;
}

export class RateLimiter {
    private db: admin.firestore.Firestore;
    private config: RateLimitOptions;
    
    constructor(options: RateLimitOptions) {
        this.db = admin.firestore();
        this.config = {
            blockDurationMs: 60000,// sets to 1 minute block by default
            ...options
        };
    }

    public async isRateLimited(identifier: string): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        const blockUntil = now + (this.config.blockDurationMs || 60000);

        const rateLimitRef = this.db.collection('rateLimits').doc(identifier);

        try {
            const result = await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(rateLimitRef);

                if(!doc.exists) {      
                    transaction.set(rateLimitRef, {
                        requests: [now],
                        blocked: false,
                        blockedUntil: 0
                    });
                    return false;
                }

                const data = doc.data();
                if(data?.blocked && data?.blockedUntil > now) {
                    return true;
                }

                // filter of request during the time window
                const recentRequests = (data?.requests || [])
                    .filter((timestamp: number) => timestamp > windowStart);
           
                // check if rate limit exceeded
                if(recentRequests.length >= this.config.maxRequests) {
                    transaction.update(rateLimitRef, {
                        blocked: true,
                        blockedUntil: blockUntil,
                        requests: recentRequests
                    });
                    return true;
                }

                // add current request
                transaction.update(rateLimitRef, {
                    requests: [...recentRequests, now],
                    blocked: false,
                    blockedUntil: null
                });
                return false;
            });

            return result; 
        } catch(error) {
            console.error("Error checking rate limit:", error);
            return false;
        }
    }

    middleware(config?: Partial<RateLimitOptions>) {
        const rateLimiter = config ? new RateLimiter({...this.config, ...config}) : this;

        return async (req: any, res: any, next: () => void) => {
            const identifier = this.getIdentifier(req);
            const isLimited = await rateLimiter.isRateLimited(identifier);
            
            if (isLimited) {
                res.status(429).json({
                    error: 'Too many requests',
                    message: 'Please try again later',
                    retryAfter: Math.ceil((this.config.blockDurationMs || 60000) / 1000)
                });
                return;
            }
            
            next();
        };
    } 

    private getIdentifier(req: any): string {
        // Try to get IP address
        const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   'unknown';

        // Fallback to session ID if available
        const sessionId = req.body?.sessionId || req.query?.sessionId;
        
        return sessionId || ip;
    }
}

// default singleton of the limiter
export const defaultRateLimiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    blockDurationMs: 60000 // 1 minute
});

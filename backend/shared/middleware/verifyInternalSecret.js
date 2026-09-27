/**
 * @file verifyInternalSecret.js (Shared Security Middleware)
 * @description Validates that requests entering internal microservices originate
 * directly from the trusted API Gateway or internal service peers, preventing
 * unauthorized direct access and header spoofing.
 */

export const verifyInternalSecret = (req, res, next) => {
    // Allow root service health check
    if (req.path === "/") {
        return next();
    }

    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    
    // If no secret is configured (e.g. initial dev), pass through
    if (!internalSecret) {
        return next();
    }

    const providedSecret = req.headers["x-internal-secret"];

    if (!providedSecret || providedSecret !== internalSecret) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: Direct microservice access not permitted"
        });
    }

    next();
};

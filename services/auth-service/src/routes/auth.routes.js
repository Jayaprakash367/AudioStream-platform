"use strict";
/**
 * Auth Service — Route Handlers
 * REST endpoints for authentication operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const common_1 = require("@auralux/common");
async function registerAuthRoutes(app, authService) {
    /** POST /auth/register */
    app.post('/auth/register', async (request, reply) => {
        const body = common_1.registerSchema.parse(request.body);
        const result = await authService.register(body);
        reply.status(201).send({
            success: true,
            data: {
                userId: result.userId,
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken,
                expiresIn: result.tokens.expiresIn,
                tokenType: 'Bearer',
            },
        });
    });
    /** POST /auth/login */
    app.post('/auth/login', async (request, reply) => {
        const body = common_1.loginSchema.parse(request.body);
        const result = await authService.login({
            ...body,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] || 'unknown',
        });
        reply.status(200).send({
            success: true,
            data: {
                userId: result.userId,
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken,
                expiresIn: result.tokens.expiresIn,
                tokenType: 'Bearer',
            },
        });
    });
    /** POST /auth/refresh */
    app.post('/auth/refresh', async (request, reply) => {
        const body = common_1.refreshTokenSchema.parse(request.body);
        const tokens = await authService.refreshToken(body.refreshToken);
        reply.status(200).send({
            success: true,
            data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
                tokenType: 'Bearer',
            },
        });
    });
    /** POST /auth/logout */
    app.post('/auth/logout', async (request, reply) => {
        const userId = request.headers['x-user-id'];
        const { refreshToken } = request.body;
        if (userId) {
            await authService.logout(userId, refreshToken);
        }
        reply.status(200).send({ success: true, data: { message: 'Logged out successfully' } });
    });
    /** POST /auth/verify-email */
    app.post('/auth/verify-email', async (request, reply) => {
        const { token } = request.body;
        await authService.verifyEmail(token);
        reply.status(200).send({ success: true, data: { message: 'Email verified successfully' } });
    });
    /** POST /auth/password-reset */
    app.post('/auth/password-reset', async (request, reply) => {
        const body = common_1.passwordResetRequestSchema.parse(request.body);
        const message = await authService.requestPasswordReset(body.email);
        reply.status(200).send({ success: true, data: { message } });
    });
    /** POST /auth/password-reset/confirm */
    app.post('/auth/password-reset/confirm', async (request, reply) => {
        const body = common_1.passwordResetConfirmSchema.parse(request.body);
        await authService.confirmPasswordReset(body.token, body.newPassword);
        reply.status(200).send({ success: true, data: { message: 'Password reset successful' } });
    });
}
//# sourceMappingURL=auth.routes.js.map
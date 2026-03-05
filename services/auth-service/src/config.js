"use strict";
/**
 * Auth Service — Configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAuthConfig = loadAuthConfig;
const common_1 = require("@auralux/common");
function loadAuthConfig() {
    const base = (0, common_1.loadBaseConfig)('auth-service', 3001);
    return {
        ...base,
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    };
}
//# sourceMappingURL=config.js.map
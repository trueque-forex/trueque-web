"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateIntegrityController = void 0;
const common_1 = require("@nestjs/common");
const rate_integrity_service_1 = require("./rate-integrity.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rate_integrity_entity_1 = require("./rate_integrity.entity");
@(0, common_1.Controller)('api/match')
class RateIntegrityController {
    rateIntegrityService;
    repo;
    constructor(rateIntegrityService, 
    @(0, typeorm_1.InjectRepository)(rate_integrity_entity_1.RateIntegrityLog)
    repo) {
        this.rateIntegrityService = rateIntegrityService;
        this.repo = repo;
    }
    @(0, common_1.Get)(':id/integrity')
    async getIntegrityLog(
    @(0, common_1.Param)('id')
    match_id) {
        const log = await this.repo.findOne({ where: { match_id } });
        if (!log)
            throw new Error('Match not found');
        return log;
    }
}
exports.RateIntegrityController = RateIntegrityController;
//# sourceMappingURL=rate-integrity.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaMonitor = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("../modules/match/match.entity");
const notification_service_1 = require("../modules/notifications/notification.service");
@(0, common_1.Injectable)()
class SlaMonitor {
    matchRepo;
    notificationService;
    constructor(
    @(0, typeorm_1.InjectRepository)(match_entity_1.Match)
    matchRepo, notificationService) {
        this.matchRepo = matchRepo;
        this.notificationService = notificationService;
    }
    async checkDeliveryDeadlines() {
        const overdueMatches = await this.matchRepo.find({
            where: {
                delivered: false,
                matchDeadline: (0, typeorm_2.LessThan)(new Date())
            }
        });
        for (const match of overdueMatches) {
            // Notify sender
            await this.notificationService.sendNotification({
                userId: match.senderId,
                type: 'sla_breach',
                message: '⏱ Delivery delay detected. We’re investigating and will update you shortly.'
            });
            // Notify receiver
            await this.notificationService.sendNotification({
                userId: match.receiverId,
                type: 'sla_breach',
                message: '⏱ Delivery delay detected. We’re investigating and will update you shortly.'
            });
            // Optional: escalate to ops
            console.warn(`⚠️ SLA breach detected for match ${match.id}`);
        }
    }
}
exports.SlaMonitor = SlaMonitor;
//# sourceMappingURL=slaMonitor.js.map
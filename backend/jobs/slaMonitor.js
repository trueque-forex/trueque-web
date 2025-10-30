var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
let SlaMonitor = class SlaMonitor {
    matchRepo;
    notificationService;
    constructor(matchRepo, notificationService) {
        this.matchRepo = matchRepo;
        this.notificationService = notificationService;
    }
    async checkDeliveryDeadlines() {
        const overdueMatches = await this.matchRepo.find({
            where: {
                delivered: false,
                matchDeadline: LessThan(new Date())
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
};
SlaMonitor = __decorate([
    Injectable(),
    __param(0, InjectRepository(Match)),
    __metadata("design:paramtypes", [Object, Object])
], SlaMonitor);
export { SlaMonitor };

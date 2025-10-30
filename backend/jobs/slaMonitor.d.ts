import { Repository } from 'typeorm';
import { Match } from '../modules/match/match.entity';
import { NotificationService } from '../modules/notifications/notification.service';
export declare class SlaMonitor {
    private readonly matchRepo;
    private readonly notificationService;
    constructor(matchRepo: Repository<Match>, notificationService: NotificationService);
    checkDeliveryDeadlines(): Promise<void>;
}
//# sourceMappingURL=slaMonitor.d.ts.map

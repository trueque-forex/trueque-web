import { RateSpreadService } from '../modules/rateSpread/rateSpread.service';
import { RateIntegrityService } from '../modules/rateIntegrity/rate-integrity.service';
import { NotificationService } from '../modules/notifications/notification.service';
import { Repository } from 'typeorm';
import { RateIntegrityLog } from '../modules/rateIntegrity/rate_integrity.entity';
import { Match } from '../modules/match/match.entity';
export declare class MatchService {
    private readonly rateSpreadService;
    private readonly rateIntegrityService;
    private readonly notificationService;
    private readonly integrityRepo;
    private readonly matchRepo;
    constructor(rateSpreadService: RateSpreadService, rateIntegrityService: RateIntegrityService, notificationService: NotificationService, integrityRepo: Repository<RateIntegrityLog>, matchRepo: Repository<Match>);
    confirmMatch(matchData: {
        senderId: string;
        receiverId: string;
        senderCountry: string;
        receiverCountry: string;
        amount_paid_A: number;
        amount_received_A: number;
        amount_paid_B: number;
        amount_received_B: number;
        sender_delivery_choice: 'instant' | 'same_day' | 'next_day' | 'batch';
        receiver_delivery_choice: 'instant' | 'same_day' | 'next_day' | 'batch';
        fee_components: {
            trueque_fee: number;
            transmitter_fee: number;
            country_model: 'OM' | 'MTB' | 'Hybrid';
        };
    }): Promise<void>;
}
//# sourceMappingURL=matchService.d.ts.map
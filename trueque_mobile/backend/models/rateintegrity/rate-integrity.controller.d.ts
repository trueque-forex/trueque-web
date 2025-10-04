import { RateIntegrityService } from './rate-integrity.service';
import { Repository } from 'typeorm';
import { RateIntegrityLog } from './rate_integrity.entity';
export declare class RateIntegrityController {
    private readonly rateIntegrityService;
    private readonly repo;
    constructor(rateIntegrityService: RateIntegrityService, repo: Repository<RateIntegrityLog>);
    getIntegrityLog(match_id: string): Promise<RateIntegrityLog>;
}
//# sourceMappingURL=rate-integrity.controller.d.ts.map
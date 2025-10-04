import { Controller, Get, Param } from '@nestjs/common';
import { RateIntegrityService } from './rate-integrity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateIntegrityLog } from './rate_integrity.entity';

@Controller('api/match')
export class RateIntegrityController {
  constructor(
    private readonly rateIntegrityService: RateIntegrityService,
    @InjectRepository(RateIntegrityLog)
    private readonly repo: Repository<RateIntegrityLog>
  ) {}

  @Get(':id/integrity')
  async getIntegrityLog(@Param('id') match_id: string): Promise<RateIntegrityLog> {
    const log = await this.repo.findOne({ where: { match_id } });
    if (!log) throw new Error('Match not found');
    return log;
  }
}
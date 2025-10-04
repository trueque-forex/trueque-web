import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Match } from '../modules/match/match.entity';
import { NotificationService } from '../modules/notifications/notification.service';

@Injectable()
export class SlaMonitor {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    private readonly notificationService: NotificationService
  ) {}

  async checkDeliveryDeadlines(): Promise<void> {
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
}
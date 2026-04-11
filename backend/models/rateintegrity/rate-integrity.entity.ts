import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RateIntegrity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  corridor: string;
}
}

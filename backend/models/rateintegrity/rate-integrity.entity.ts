import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RateIntegrity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  corridor: string;
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

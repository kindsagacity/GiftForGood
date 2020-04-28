import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import Creator from '../creator/creator.entity';
import Employer from '../employer/employer.entity';
import { VerificationEmailType } from './account.definitions';

@Entity()
export default class AccountVerify {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(_ => Creator)
  @JoinColumn()
  public creator: Creator;

  @OneToOne(_ => Employer)
  @JoinColumn()
  public employer: Employer;

  @Column()
  public verificationCode: string;

  @Column()
  public validTill: Date;

  @Index()
  @Column({ type: 'integer' })
  public emailType: VerificationEmailType;
}

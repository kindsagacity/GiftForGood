import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import Creator from '../creator/creator.entity';
import Employer from '../employer/employer.entity';
import Staff from '../staff/staff.entity';

export interface SessionData {}

export interface UserSession {
  id: string;
  data: SessionData;
}

@Entity()
export default class Session {
  @PrimaryColumn()
  public id: string;

  @OneToOne(_ => Creator, { nullable: true })
  @JoinColumn()
  public creator: Creator;

  @OneToOne(_ => Employer, { nullable: true })
  @JoinColumn()
  public employer: Employer;

  @OneToOne(_ => Staff, { nullable: true })
  @JoinColumn()
  public staff: Staff;

  @Column({ nullable: false })
  public validTill: Date;

  @Column({ type: 'jsonb', nullable: false, default: '[]' })
  public data: SessionData;
}

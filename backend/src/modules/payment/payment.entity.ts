import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { values } from 'lodash';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Employer from '../employer/employer.entity';
import { EmployerPlanMetadata } from './payment.definitions';

export enum SubscriptionStatus {
  Trialing = 'trialing',
  Active = 'active',
  PastDue = 'past_due',
  Canceled = 'canceled',
  Unpaid = 'unpaid',
}

@Entity()
export class EmployerSubscriptionPlan {
  @ApiModelProperty({ readOnly: true, type: 'number' })
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty({ type: Employer, readOnly: true })
  @OneToOne(_ => Employer, { nullable: true })
  @JoinColumn()
  public employer: Employer;

  @ApiModelProperty({ readOnly: true })
  @Column({ type: 'text', nullable: false })
  public stripeSubscriptionId: string;

  @ApiModelProperty({
    type: 'string',
    enum: values(SubscriptionStatus),
    readOnly: true,
  })
  @Column({ type: 'text', nullable: false })
  public status: string;

  @ApiModelProperty({ format: 'date' })
  @Column({ nullable: true })
  public periodStart: Date;

  @ApiModelProperty({ format: 'date' })
  @Column()
  public periodEnd: Date;

  @ApiModelProperty({ format: 'date' })
  @Column()
  public endedAt: Date;

  @ApiModelProperty({ format: 'date' })
  @Column({ nullable: true })
  public trialUntil: Date;

  @Column({ type: 'jsonb', nullable: false, default: '{}' })
  public metaData: any;

  @ApiModelPropertyOptional({ type: 'boolean', default: true })
  @Column()
  public active: boolean;

  @ApiModelProperty({ readOnly: true, format: 'date' })
  @CreateDateColumn()
  public createdAt: Date;

  @ApiModelProperty({ readOnly: true, format: 'date' })
  @UpdateDateColumn()
  public updatedAt: Date;
}

@Entity()
export class EmployerNextPlan {
  @ApiModelProperty({ readOnly: true, type: 'number' })
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty({ type: Employer, readOnly: true })
  @OneToOne(_ => Employer, { nullable: true })
  @JoinColumn()
  public employer: Employer;

  @ApiModelProperty({ readOnly: true })
  @Column({ type: 'text', nullable: false })
  public stripePlanId: string;

  @ApiModelProperty({ format: 'date' })
  @Column()
  public startsAt: Date;

  @ApiModelProperty({ type: EmployerPlanMetadata })
  @Column({ type: 'jsonb', nullable: false, default: '{}' })
  public metaData: EmployerPlanMetadata;

  @ApiModelProperty({ readOnly: true, format: 'date' })
  @CreateDateColumn()
  public createdAt: Date;

  @ApiModelProperty({ readOnly: true, format: 'date' })
  @UpdateDateColumn()
  public updatedAt: Date;
}

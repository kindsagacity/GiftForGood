import { Inject, Injectable } from '@nestjs/common';
import * as Stripe from 'stripe';
import { Repository } from 'typeorm';
import Employer from '../employer/employer.entity';
import { EmployerSubscriptionPlan, EmployerNextPlan, SubscriptionStatus } from './payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { paymentConfig } from '../../config';
import { transformCardObject, transformPlanObject } from './payment.helpers';
import * as Raven from 'raven';
import { Creator } from '../creator';
import * as _ from 'lodash';
import Job from '../job/job.entity';
import { EmployerPlanMetadata } from './payment.definitions';
import { JobStatus } from '../job/job.enum';

export class StripeCustomer {
  readonly instance: string;
  private repository: Repository<Employer | Creator>;

  constructor(private readonly stripe, repository: Repository<Employer | Creator>) {
    this.instance = process.env.NODE_ENV;
    this.repository = repository;
  }

  /**
   * Returns associated Stripe customer by user.stripeCustomerId
   *
   * @param {*} user
   * @returns {(Promise<Stripe.customers.ICustomer | null>)}
   * @memberof StripeCustomer
   */
  public retrieve(user): Promise<Stripe.customers.ICustomer | null> {
    return user.stripeCustomerId ? this.stripe.customers.retrieve(user.stripeCustomerId) : null;
  }

  /**
   * Creates Stripe customer and associate it with provided user (Creator | Employer)
   *
   * @param {*} user
   * @param {string} cardToken
   * @returns {Promise<Stripe.customers.ICustomer>}
   * @memberof StripeCustomer
   */
  public async create(user, cardToken: string): Promise<Stripe.customers.ICustomer> {
    if (user.stripeCustomerId) {
      throw new Error('Stripe Customer for this User already exists');
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      description: ``,
      source: cardToken,
      metadata: {
        instance: this.instance,
        id: user.id,
      },
    });

    user.stripeCustomerId = customer.id;
    await this.repository.save(user);

    return customer;
  }

  /**
   * Updates default payment for Stripe customer.
   *
   * @param {*} user
   * @param {string} cardToken
   * @returns {Promise<Stripe.customers.ICustomer>}
   * @memberof StripeCustomer
   */
  public async updateDefaultPayment(user, cardToken: string): Promise<Stripe.customers.ICustomer> {
    if (!user.stripeCustomerId) {
      throw new Error('Stripe Customer for this User doesn\'t exist');
    }

    return this.stripe.customers.update(user.stripeCustomerId, {
      source: cardToken,
    });
  }
}

export class StripeService {
  public stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Creates Stripe subscription
   *
   * @param {string} customer
   * @param {string} plan
   * @param {Partial<Stripe.subscriptions.ISubscriptionCreationOptions>} [params]
   * @returns
   * @memberof StripeService
   */
  public createSubscription(
    customer: string,
    plan: string,
    params?: Partial<Stripe.subscriptions.ISubscriptionCreationOptions>,
  ) {
    const subscriptionPayload: Stripe.subscriptions.ISubscriptionCreationOptions = {
      customer,
      items: [{ plan }],
    };
    Object.assign(subscriptionPayload, params);
    return this.stripe.subscriptions.create(subscriptionPayload);
  }

  /**
   * Updates Stripe subscription
   *
   * @param {string} subscriptionId
   * @param {Partial<Stripe.subscriptions.ISubscriptionUpdateOptions>} [params]
   * @returns
   * @memberof StripeService
   */
  public updateSubscription(subscriptionId: string, params?: Partial<Stripe.subscriptions.ISubscriptionUpdateOptions>) {
    return this.stripe.subscriptions.update(subscriptionId, params);
  }

  /**
   * Returns Stripe plan
   *
   * @param {string} plan
   * @returns
   * @memberof StripeService
   */
  public retrievePlan(plan: string) {
    try {
      return this.stripe.plans.retrieve(plan);
    } catch (e) {
      throw new Error('Plan is not exist');
    }
  }

  /**
   * Returns Stripe subscription
   *
   * @param {string} subscription
   * @returns {Promise<Stripe.subscriptions.ISubscription>}
   * @memberof StripeService
   */
  public retrieveSubscription(subscription: string): Promise<Stripe.subscriptions.ISubscription> {
    try {
      return this.stripe.subscriptions.retrieve(subscription);
    } catch (e) {
      throw new Error('Subscription is not exist');
    }
  }

  /**
   * Returns Stripe customer default card
   *
   * @param {string} customer
   * @returns
   * @memberof StripeService
   */
  public async retrieveDefaultCard(customer: string) {
    const cards = await this.stripe.customers.listCards(customer);
    return cards.data[0];
  }

  /**
   * Returns Stripe subscriptions list by customer
   *
   * @param {string} customer
   * @param {number} [limit=1]
   * @param {Partial<Stripe.subscriptions.ISubscriptionListOptions>} [params]
   * @returns
   * @memberof StripeService
   */
  public getSubscriptionsByCustomer(
    customer: string,
    limit: number = 1,
    params?: Partial<Stripe.subscriptions.ISubscriptionListOptions>,
  ) {
    const payload: Stripe.subscriptions.ISubscriptionListOptions = {
      customer,
      limit,
    };
    Object.assign(payload, params);
    return this.stripe.subscriptions.list(payload);
  }

  /**
   * Returns Stripe plan by product id
   *
   * @param {string} productId
   * @param {number} [limit=10]
   * @returns
   * @memberof StripeService
   */
  public getPlansByProduct(productId: string, limit: number = 10) {
    return this.stripe.plans.list({
      product: productId,
      limit,
    });
  }

  /**
   * Creates Stripe event
   *
   * @param {string} sign
   * @param {*} body
   * @returns {Stripe.events.IEvent}
   * @memberof StripeService
   */
  public constructEvent(sign: string, body: any): Stripe.events.IEvent {
    if (!this.webhookSecret) {
      throw new Error(`Stripe Webhook not defined`);
    }

    return this.stripe.webhooks.constructEvent(body, sign, this.webhookSecret);
  }
}

@Injectable()
export class EmployerPlanService extends StripeService {
  private stripeCustomer: StripeCustomer;

  constructor(
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer | Creator>,
    @InjectRepository(EmployerSubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<EmployerSubscriptionPlan>,
    @InjectRepository(EmployerNextPlan)
    private readonly nextPlanRepository: Repository<EmployerNextPlan>,
    @Inject('RAVEN_SENTRY_PROVIDER')
    private readonly sentryClient: Raven.Client,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {
    super();
    this.stripeCustomer = new StripeCustomer(this.stripe, employerRepository);
  }

  /**
   * Acquires plan for employer
   *
   * @param {Employer} user
   * @param {string} planId
   * @returns
   * @memberof EmployerPlanService
   */
  public async buyPlan(user: any, planId: string) {
    let trialDaysLeft = 0;
    if (!user.stripeCustomerId) {
      throw new Error('Stripe Customer for this User doesn\'t exist');
    }

    let subscriptions = await this.getSubscriptionsByCustomer(user.stripeCustomerId);
    if (subscriptions.data.length) {
      throw new Error('Subscription for this user already exist');
    }

    const plan = await this.retrievePlan(planId);

    if (plan.trial_period_days) {
      trialDaysLeft = plan.trial_period_days;
      subscriptions = await this.getSubscriptionsByCustomer(user.stripeCustomerId, 1, {
        status: SubscriptionStatus.Canceled,
        plan: plan.id,
      });
      if (subscriptions.data.length) {
        // drop off to 0 if plan already was bought
        trialDaysLeft = 0;
      }
    }
    const subscription = await this.createSubscription(user.stripeCustomerId, plan.id, {
      trial_period_days: trialDaysLeft,
    });

    return this.updateDBSubscriptionPlan(user, subscription);
  }

  /**
   * Cancels employer plan
   *
   * @param {Employer} user
   * @param {string} planId
   * @returns
   * @memberof EmployerPlanService
   */
  public async cancelPlan(user: Employer, planId: string) {
    await this.retrievePlan(planId);

    const subscriptions = await this.getSubscriptionsByCustomer(user.stripeCustomerId, 1, {
      plan: planId,
    });

    if (!subscriptions.data.length) {
      throw new Error('No active subscriptions found');
    }

    const subscription = await this.updateSubscription(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    await this.nextPlanRepository.delete({ employer: user });
    return this.updateDBSubscriptionPlan(user, subscription);
  }

  /**
   * Chooses new plan for employer
   *
   * @param {Employer} user
   * @param {string} newPlanId
   * @memberof EmployerPlanService
   */
  public async updatePlan(user: Employer, newPlanId: string) {
    await this.retrievePlan(newPlanId);

    const subscriptions = await this.getSubscriptionsByCustomer(user.stripeCustomerId);
    if (!subscriptions.data.length) {
      throw new Error('No active subscriptions found');
    }
    const planId = subscriptions.data[0].plan.id;
    const subscription = await this.cancelPlan(user, planId);
    await this.setNextSubscription(user, subscription, newPlanId);
  }

  /**
   * Get plans list
   *
   * @returns
   * @memberof EmployerPlanService
   */
  public async getProductPlans() {
    return this.getPlansByProduct(paymentConfig.employerProductId);
  }

  /**
   * Updates Stripe customer default payment
   *
   * @param {Employer} user
   * @param {string} cardToken
   * @returns
   * @memberof EmployerPlanService
   */
  public async updatePayment(user: Employer, cardToken: string) {
    let customer;
    if (cardToken && !user.stripeCustomerId) {
      customer = await this.stripeCustomer.create(user, cardToken);
    }
    if (cardToken && user.stripeCustomerId) {
      customer = await this.stripeCustomer.updateDefaultPayment(user, cardToken);
    }

    return customer ? customer.id : user.stripeCustomerId;
  }

  /**
   * Returns employer payment info
   *
   * @param {Employer} employer
   * @returns
   * @memberof EmployerPlanService
   */
  public async getPaymentInfo(employer: Employer) {
    let card;
    const activeSubscription = await this.subscriptionPlanRepository.findOne({
      employer,
      active: true,
    });

    if (!activeSubscription) return;
    const subscription = await this.retrieveSubscription(activeSubscription.stripeSubscriptionId);
    try {
      card = await this.retrieveDefaultCard(employer.stripeCustomerId);
    } catch (e) {
      this.sentryClient.context({ employer }, () => this.sentryClient.captureException(e));
    }
    return {
      plan: transformPlanObject(subscription.plan),
      card: transformCardObject(card),
    };
  }

  /**
   * Updates employer subscription plan according to provided subscription description
   *
   * @param {Employer} employer
   * @param {Stripe.subscriptions.ISubscription} subscription
   * @param {Partial<EmployerSubscriptionPlan>} [params={}]
   * @returns
   * @memberof EmployerPlanService
   */
  public async updateDBSubscriptionPlan(
    employer: any,
    subscription: Stripe.subscriptions.ISubscription,
    params: Partial<EmployerSubscriptionPlan> = {},
  ) {
    let userSubscription = await this.subscriptionPlanRepository.findOne({
      employer,
      stripeSubscriptionId: subscription.id,
    });

    if (!userSubscription) {
      userSubscription = this.subscriptionPlanRepository.create({ employer });
    }

    Object.assign(userSubscription, {
      status: subscription.status,
      periodStart: new Date(subscription.current_period_start * 1000),
      periodEnd: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
    });

    if (subscription.trial_end) {
      userSubscription.trialUntil = new Date(subscription.trial_end * 1000);
    }

    if (subscription.ended_at) {
      userSubscription.endedAt = new Date(subscription.ended_at * 1000);
    } else if (subscription.canceled_at) {
      userSubscription.endedAt = new Date(subscription.canceled_at * 1000);
    }

    userSubscription.metaData = subscription.plan.metadata;
    Object.assign(userSubscription, params);

    return this.subscriptionPlanRepository.save(userSubscription);
  }

  /**
   * Sets employer next subscription plan.
   *
   * @param {Employer} employer
   * @param {EmployerSubscriptionPlan} currentSubscription
   * @param {string} planId
   * @memberof EmployerPlanService
   */
  public async setNextSubscription(employer: Employer, currentSubscription: EmployerSubscriptionPlan, planId: string) {
    const plan = await this.retrievePlan(planId);
    const nextSubscription = this.nextPlanRepository.create({ employer });
    nextSubscription.stripePlanId = planId;
    nextSubscription.metaData = plan.metadata;
    nextSubscription.startsAt = currentSubscription.periodEnd;
    await this.nextPlanRepository.save(nextSubscription);
  }

  /**
   * Marks employer jobs as inactive.
   *
   * @param {number} employerId
   * @returns
   * @memberof EmployerPlanService
   */
  public setJobsInactive(employerId: number) {
    return this.jobRepository.update({ employerId }, { status: JobStatus.Closed });
  }

  /**
   * Handles Stripe webhook event.
   *
   * @param {*} event
   * @returns
   * @memberof EmployerPlanService
   */
  public async handleEvent(event: any) {
    const eventType = event.type;
    const payload = event.data.object;
    const subscriptionParams: Partial<EmployerSubscriptionPlan> = {};
    const trackEvents = {
      PAYMENT_FAILED: 'invoice.payment_failed',
      SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
      SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
      PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
    };

    if (_.values(trackEvents).indexOf(eventType) === -1) return;

    const subscriptionId = payload.subscription || payload.id;

    const employer = await this.employerRepository.findOne({ stripeCustomerId: payload.customer });
    if (!employer) {
      throw new Error('Employer not found');
    }

    const subscription = await this.retrieveSubscription(subscriptionId);
    const nextPlan = await this.nextPlanRepository.findOne({
      employer,
    });
    const currentMetaData = (subscription.plan.metadata as any) as EmployerPlanMetadata;

    // if the employer has an updated plan then buy it
    if (eventType === trackEvents.SUBSCRIPTION_DELETED) {
      if (nextPlan) {
        await this.buyPlan(employer, nextPlan.stripePlanId);
        if (parseInt(currentMetaData.active_posts, 10) > parseInt(nextPlan.metaData.active_posts, 10)) {
          await this.setJobsInactive(employer.id);
        }
        await this.nextPlanRepository.remove(nextPlan);
      } else {
        await this.setJobsInactive(employer.id);
      }
    }
    // set inactive if subscription is cancel or payment fail
    if (eventType === trackEvents.PAYMENT_FAILED || eventType === trackEvents.SUBSCRIPTION_DELETED) {
      subscriptionParams.active = false;
    }

    // set inactive employer jobs if payment fail
    if (eventType === trackEvents.PAYMENT_FAILED) {
      await this.setJobsInactive(employer.id);
    }
    // set active if payment succeed
    if (eventType === trackEvents.PAYMENT_SUCCEEDED) {
      subscriptionParams.active = true;
    }

    await this.updateDBSubscriptionPlan(employer, subscription, subscriptionParams);
  }
}

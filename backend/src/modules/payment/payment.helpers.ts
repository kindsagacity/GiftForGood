import { CardResponseDto, PlanResponseDto } from './payment.definitions';
import * as _ from 'lodash';

/**
 * Excludes all unneeded fields from EmployerSubscriptionPlan object.
 *
 * @param {*} plan
 * @returns {PlanResponseDto}
 */
export const transformPlanObject = (plan: any) => {
  return _.pick(plan, Object.keys(new PlanResponseDto()));
};

/**
 * Excludes all unneeded fields from card description object.
 *
 * @param {*} card
 * @returns {Object}
 */
export const transformCardObject = (card: any) => {
  return _.pick(card, Object.keys(new CardResponseDto()));
};

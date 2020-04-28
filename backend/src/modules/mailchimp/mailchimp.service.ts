import { Inject, Injectable } from '@nestjs/common';
import * as request from 'request';
import * as Raven from 'raven';
import { mailchimp } from '../../config';

@Injectable()
export default class MailChimpService {
  private apiKey: string;
  private readonly baseUrl: string;

  /**
   * Creates an instance of MailChimpService.
   * @param {Raven.Client} sentryClient
   * @memberof MailChimpService
   */
  constructor(
    @Inject('RAVEN_SENTRY_PROVIDER')
    private readonly sentryClient: Raven.Client,
  ) {
    if (!process.env.MAILCHIMP_KEY) {
      this.sentryClient.captureException(new Error('MailChimp key is not defined'));
      return;
    }
    this.apiKey = process.env.MAILCHIMP_KEY;
    const instance = this.apiKey.split('-')[1];
    this.baseUrl = `https://${instance}.api.mailchimp.com/3.0`;
  }

  /**
   * Do POST request to mailchimp by source url
   *
   * @param {string} source Source url
   * @param {*} [data]
   * @returns Result of POST request
   * @memberof MailChimpService
   */
  public async call(source: string, data?: any) {
    return new Promise((resolve, reject) => {
      request(
        {
          method: 'POST',
          url: `${this.baseUrl}/${source}`,
          headers: {
            authorization: 'Basic ' + Buffer.from('any:' + this.apiKey).toString('base64'),
          },
          json: true,
          body: data,
        },
        (error, response) => {
          if (error) {
            return reject(error);
          }
          if (response.statusCode > 300) {
            return reject(response.body);
          }
          resolve(response.body);
        },
      );
    });
  }

  /**
   * Subscribe user by email to subscribtion list
   * @param {string} email
   * @param {string} listId
   * @returns
   * @memberof MailChimpService
   */
  public async subscribeOne(email: string, listId: string) {
    if (!listId) return;
    try {
      await this.call(`lists/${listId}/members`, { email_address: email, status: 'subscribed' });
    } catch (e) {
      this.sentryClient.captureException(new Error('[MailChimp] Cannot subscribe new member'), {
        extra: { email, listId, error: e },
      });
    }
  }

  /**
   * Subscribe creator by email to creator subscription list
   * @param {string} email
   * @memberof MailChimpService
   */
  public async subscribeCreator(email: string) {
    await this.subscribeOne(email, mailchimp.listId.creator);
  }

  /**
   * Subscribe employer by email to employer subscription list
   * @param {string} email
   * @memberof MailChimpService
   */
  public async subscribeEmployer(email: string) {
    await this.subscribeOne(email, mailchimp.listId.employer);
  }
}

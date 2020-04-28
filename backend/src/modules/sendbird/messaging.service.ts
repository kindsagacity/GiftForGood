import { Inject, Injectable } from '@nestjs/common';
import * as request from 'request';
import * as Raven from 'raven';
import { SendBirdAction } from './SendBirdAction';
// import SendBird from 'sendbird';
import * as SendBird from 'sendbird';

@Injectable()
export default class MessagingService {
  /**
   * Creates an instance of MailChimpService.
   * @param {Raven.Client} sentryClient
   * @memberof MessagingService
   */
  constructor(
    @Inject('RAVEN_SENTRY_PROVIDER')
    private readonly sentryClient: Raven.Client,
  ) {
    if (!process.env.SENDBIRD_APP_ID) {
      this.sentryClient.captureException(new Error('Sendbird app id is not defined'));
      return;
    }
  }

  /**
   * Subscribe employer by email to employer subscription list
   * @param {string} email
   * @memberof MessagingService
   */
  public async updateUsersInSendbird(userlist: any) {
    const sb = new SendBirdAction();
    try {
      for (let index = 0; index < userlist.length; index++) {
        // for (let index = 0; index < 5; index++) {
        const user = userlist[index];
        const { email, firstName, lastName, photo, titles } = user;

        await sb.connect(email, firstName + ' ' + lastName, photo);
        await sb.setAutoAccept(false);
        await sb.createMetaData(firstName + ' ' + lastName, JSON.stringify(titles.slice(0, 3)));
        await sb.disconnect();
        // console.log('id ', email, ', index ', index, ', total ', userlist.length);
      }
    } catch (e) {
      console.log('updateUserInSendbird issue ', e);
    }
  }
}

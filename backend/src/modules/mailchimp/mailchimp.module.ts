import { Module } from '@nestjs/common';
import MailChimpService from './mailchimp.service';

@Module({
  providers: [MailChimpService],
  exports: [MailChimpService],
})
export default class MailChimpModule {}

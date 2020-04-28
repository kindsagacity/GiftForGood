import * as mandrillTransport from 'nodemailer-mandrill-transport';
import * as fs from 'fs';

const imagePath = process.env.EMAIL_TEMPLATE_DIR + '/images';

const getImageBase64 = (fileName: string) => {
  try {
    return fs.readFileSync(imagePath + '/' + fileName).toString('base64');
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e.message);
    return '';
  }
};

const mandrillOptions = {
  message: {
    images: [
      {
        type: 'image/png',
        name: 'logo',
        content: getImageBase64('girlgazesticker.png'),
      },
      {
        type: 'image/png',
        name: 'fb',
        content: getImageBase64('ic_facebook.png'),
      },
      {
        type: 'image/png',
        name: 'instagram',
        content: getImageBase64('ic_instagram.png'),
      },
      {
        type: 'image/png',
        name: 'linkedin',
        content: getImageBase64('ic_linkedin.png'),
      },
      {
        type: 'image/png',
        name: 'twitter',
        content: getImageBase64('ic_twitter.png'),
      },
    ],
  },
};

export const mailContentOptions = {
  confirmEmail: {
    subject: 'Confirm your email address',
    template: 'confirm-email',
  },
  resetPassword: {
    subject: 'Girlgaze password reset',
    template: 'reset-password',
    mandrillOptions,
  },
  initializePassword: {
    subject: 'It’s time to reset your password!',
    template: 'initialize-password',
    mandrillOptions,
  },
  requestApplyJob: {
    subject: 'New applicant!',
    template: 'apply-job-request',
    mandrillOptions,
  },
  feedback: {
    subject: 'New feedback',
    template: 'feedback',
    mandrillOptions,
  },
};

export default {
  transport: mandrillTransport({
    auth: {
      apiKey: process.env.MANDRILL_API_KEY || 'hwdQDh9SNOn6TC9jfeubkw',
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: true,
  }),
  defaults: {
    forceEmbeddedImages: true,
    from: process.env.DEFAULT_FROM_EMAIL || '"Girlgaze" <no-reply@girlgaze.tv>',
  },
  templateDir: process.env.EMAIL_TEMPLATE_DIR || './src/email-templates',
  templateOptions: {
    engine: 'handlebars',
  },
  feedbackTo: process.env.EMAIL_FEEDBACK_TO || 'test_user@weezlabs.com',
};

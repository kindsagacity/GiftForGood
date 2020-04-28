export default {
  allowDomains: process.env.ROOT_DOMAINS
    ? process.env.ROOT_DOMAINS.split(',')
    : ['girlgaze.com', 'girlgaze.tv', 'localhost', 'localhost:3000'],
  passwordSaltRounds: process.env.NODE_ENV === 'production' ? 8 : 1,
  sessionLifetime: process.env.SESSION_LIFETIME || 7 * 86400, // One week in seconds
  passwordResetLifetime: process.env.PASSWORD_RESET_LIFETIME || 3600, // One hour
  brandsApiUrl: 'https://autocomplete.clearbit.com/v1/companies/suggest?query=',
  //applicationHost: process.env.APPLICATION_HOST || 'https://jobs.girlgaze.com',
  applicationHost: process.env.APPLICATION_HOST || 'https://beta.girlgaze.com',
  sentryDSN:
    process.env.NODE_ENV === 'development'
      ? null
      : process.env.SENTRY_DSN || 'https://515253891f36458481a85f2f8105e4de@sentry.io/1383489',
  projectsCountThreshold: 3,
  maxItemsInList: 50, // Pagination threshold
  locationSearchRadius: 50 * 1000, // meters
  betaCreatorAccess: Boolean(process.env.BETA_ACCESS_CREATOR) || false,
  betaEmployerAccess: Boolean(process.env.BETA_ACCESS_EMPLOYER) || false,
  subscribeOnSignupTo: process.env.SIGNUP_FOLLOW ? process.env.SIGNUP_FOLLOW.split(',') : undefined,
};

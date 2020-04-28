export default interface User {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  password: string;
  photo: string;
  coverPhoto: string;
  preferredPronouns: string[];
  titles: string[];
  socialMediaLinks: string[];
  websiteLink: string;
  bio: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  socialAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
  type?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  passwordInited: boolean;
}

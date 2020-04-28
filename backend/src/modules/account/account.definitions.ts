export const VALID_NAME_RE = /[^\s]+/;
export const VALID_USERNAME_RE = /^[\da-zA-Z-_.]+$/;
export const VALID_PASSWORD_RE = /^[\dA-Za-z~!@#\$%\^&\*\(\)_\+\`\-=\{\}\[\]:;<>\./\\]+$/;

export enum VerificationEmailType {
  AccountVerification,
  ResetPassword,
}

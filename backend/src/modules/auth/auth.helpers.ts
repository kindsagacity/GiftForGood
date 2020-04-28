import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';
import { generalConfig, googleCredentials } from '../../config';
import User from '../../interfaces/user.interface';
import { UserProfileDto } from './auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { HttpException, HttpStatus } from '@nestjs/common';

export const GenerateRandomString = (
  length: number = 8,
  dictionary = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.@$%#',
) => {
  if (length >= dictionary.length) {
    throw new Error('length value is too big');
  }

  let password = '';
  while (password.length < length) {
    const letter = dictionary.charAt(Math.floor(Math.random() * dictionary.length));
    if (password.indexOf(letter) === -1) {
      password += letter;
    }
  }
  return password;
};

export const IsPasswordCorrect = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const HashPassword = async (password: string) => {
  return await bcrypt.hash(password, generalConfig.passwordSaltRounds);
};

export const transformUserObject = (user: User, additionalFields: string[] = []) => {
  return _.pick(user, Object.keys(new UserProfileDto()).concat(additionalFields));
};

export const getGoogleAccount = async (token: string) => {
  const client = new OAuth2Client(googleCredentials);
  client.setCredentials({ access_token: token });

  const authorizer = google.oauth2({ auth: client, version: 'v2' });

  let account;
  try {
    account = await authorizer.userinfo.get();
  } catch (e) {
    throw new HttpException('Unable to find google account', HttpStatus.UNAUTHORIZED);
  }

  if (!account || !account.data || !account.data.email) {
    throw new HttpException('Unable to find google account', HttpStatus.UNAUTHORIZED);
  }

  return account.data;
};

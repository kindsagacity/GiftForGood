import * as AWS from 'aws-sdk';
import { s3Config } from '../../config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  public s3Client: AWS.S3;

  constructor() {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });
    AWS.config.apiVersions = {
      s3: '2006-03-01',
    };
    this.s3Client = new AWS.S3();
  }

  /**
   * Uploads specified file to S3 bucket with specified filename.
   *
   * @param {string} fileName
   * @param {string} bucket
   * @param {Buffer} body
   * @returns {Promise<boolean>}
   * @memberof S3Service
   */
  public async putObject(fileName: string, bucket: string, body: Buffer): Promise<boolean> {
    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: body,
    };
    return new Promise((resolve, reject) => {
      this.s3Client.putObject(params, (err, data) => {
        err ? reject(err) : resolve(true);
      });
    }) as Promise<boolean>;
  }

  /**
   * Returns one-time download link for specified file.
   *
   * @param {*} fileName
   * @param {*} bucket
   * @returns {Promise<string>}
   * @memberof S3Service
   */
  public async getOneTimeDownloadUrl(fileName, bucket): Promise<string> {
    const payload = {
      Bucket: bucket,
      Key: decodeURI(fileName),
      Expires: s3Config.downloadUrlExpire,
    };
    return new Promise((resolve, reject) => {
      this.s3Client.getSignedUrl('getObject', payload, (err, url) => {
        err ? reject(err) : resolve(url);
      });
    }) as Promise<string>;
  }
}

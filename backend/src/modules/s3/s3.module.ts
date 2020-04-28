import { Module } from '@nestjs/common';
import S3Controller from './s3.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [],
  controllers: [S3Controller],
  providers: [S3Service],
})
export default class S3Module {}

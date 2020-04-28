import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Connection } from 'typeorm';
import { SetAclResource } from '../acl';
import { PublicAccessibleRoute } from '../auth';

@Controller()
@SetAclResource('index')
export default class AppController {
  constructor(private readonly connection: Connection) {}

  @ApiOperation({ title: 'API version', description: 'Package name with package version' })
  @ApiBearerAuth()
  @Get()
  public index() {
    return {
      name: process.env.npm_package_name,
      version: process.env.npm_package_version,
    };
  }

  @ApiOperation({ title: 'Health check', description: 'Health check for an API' })
  @PublicAccessibleRoute()
  @Get('/health')
  public health() {
    return {
      status: 'ok',
      databaseConnected: this.connection.isConnected,
    };
  }
}

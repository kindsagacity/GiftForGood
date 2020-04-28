import {
  BadRequestException,
  Controller,
  FileInterceptor,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiOkResponse, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { ResumeDownloadRequestDto, ResumeDownloadResponseDto, ResumeUploadParamsResponseDto } from './s3.definitions';
import { S3Service } from './s3.service';
import { s3Config } from '../../config';

@ApiBearerAuth()
@ApiUseTags('s3')
@Controller('s3')
export default class S3Controller {
  constructor(public service: S3Service) {}

  @ApiOperation({
    title: 'S3 upload resume',
    description: `Upload resume file to s3 and return file key`,
  })
  @ApiOkResponse({ type: ResumeUploadParamsResponseDto })
  @UseInterceptors(
    FileInterceptor('resume', {
      fileFilter: (req: any, file: any, cb: any) => {
        if (
          file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
          file.mimetype !== 'application/pdf'
        ) {
          cb(new BadRequestException('Not valid file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'resume', required: true, description: 'Resume file pdf, docx' })
  @Post('upload_resume')
  async uploadResumeFile(@UploadedFile() file) {
    const fileArray = file.originalname.split('.');
    const fileName = 'resume-' + new Date().getTime() + '.' + fileArray[fileArray.length - 1];
    await this.service.putObject(fileName, s3Config.resumeBucket, file.buffer);
    return {
      fileKey: fileName,
    };
  }

  @ApiOperation({
    title: 'S3 resume download link',
    description: `Returns resume download link`,
  })
  @ApiOkResponse({ type: ResumeDownloadResponseDto })
  @Get('resume')
  async getResumeLink(@Query() params: ResumeDownloadRequestDto) {
    const downloadUrl = await this.service.getOneTimeDownloadUrl(params.fileKey, s3Config.resumeBucket);
    return {
      downloadUrl,
    };
  }
}

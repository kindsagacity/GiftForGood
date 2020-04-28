import { ApiModelProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class ResumeUploadParamsResponseDto {
  @ApiModelProperty({ type: String })
  fileKey: string;
}

export class ResumeDownloadRequestDto {
  @ApiModelProperty({
    required: true,
    type: String,
    description: 'Download file name',
  })
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  fileKey: string;
}

export class ResumeDownloadResponseDto {
  @ApiModelProperty({ type: String })
  downloadUrl: string;
}

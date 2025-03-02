import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTokenDto {
  @ApiProperty({
    description: 'JWT token to validate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class TokenValidationResponse {
  @ApiProperty({
    description: 'Whether the token is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'User ID if token is valid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  userId?: string;
}

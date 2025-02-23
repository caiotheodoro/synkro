import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class AuthResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty()
  user: User;
}

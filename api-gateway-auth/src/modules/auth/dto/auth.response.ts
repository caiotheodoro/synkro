import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../user/entities/user.entity';

export class AuthUserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;
}

export class AuthResponse {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: AuthUserResponse })
  user: AuthUserResponse;
}

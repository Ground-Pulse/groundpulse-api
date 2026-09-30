import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from './casl-ability.factory';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          process.env.JWT_SECRET ||
          'groundpulse_default_jwt_secret',
        signOptions: {
          expiresIn:
            configService.get<string>('JWT_EXPIRES_IN') ||
            process.env.JWT_EXPIRES_IN ||
            '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    CaslAbilityFactory,
    PoliciesGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    CaslAbilityFactory,
    PoliciesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProviderService } from './provider.service';

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProviders() {
    return this.providerService.findAllProviders();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProvider(@Param('id') id: string) {
    return this.providerService.findProviderById(id);
  }
}

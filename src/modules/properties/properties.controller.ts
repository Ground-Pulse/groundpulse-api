import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Request() req) {
    return this.propertiesService.findAllByOwner(req.user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Request() req, @Param('id') id: string) {
    return this.propertiesService.findOne(id, req.user.id);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreateInspectionDto,
  UpdateInspectionStatusDto,
} from './dto/inspection.dto';
import { InspectionService } from './inspection.service';

@Controller('inspections')
@UseGuards(JwtAuthGuard)
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInspectionDto) {
    return this.inspectionService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Request() req) {
    return this.inspectionService.findAllForUser(req.user.id, req.user.role);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.inspectionService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateInspectionStatusDto,
  ) {
    return this.inspectionService.updateStatus(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
  }
}

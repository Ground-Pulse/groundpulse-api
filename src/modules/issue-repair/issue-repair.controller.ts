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
  ApproveIssueDto,
  AssignRepairDto,
  CreateIssueDto,
  UpdateRepairStatusDto,
} from './dto/issue-repair.dto';
import { IssueRepairService } from './issue-repair.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class IssueRepairController {
  constructor(private readonly issueRepairService: IssueRepairService) {}

  // ISSUES ENDPOINTS
  @Post('issues')
  @HttpCode(HttpStatus.CREATED)
  async createIssue(@Request() req, @Body() dto: CreateIssueDto) {
    return this.issueRepairService.createIssue(req.user.id, req.user.role, dto);
  }

  @Get('issues')
  @HttpCode(HttpStatus.OK)
  async getIssues(@Request() req) {
    return this.issueRepairService.findIssuesForUser(req.user.id, req.user.role);
  }

  @Patch('issues/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveIssue(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ApproveIssueDto,
  ) {
    return this.issueRepairService.approveIssueAndDispatchRepair(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  // REPAIRS ENDPOINTS
  @Get('repairs')
  @HttpCode(HttpStatus.OK)
  async getRepairs(@Request() req) {
    return this.issueRepairService.findRepairsForUser(req.user.id, req.user.role);
  }

  @Patch('repairs/:id/assign')
  @HttpCode(HttpStatus.OK)
  async assignProvider(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AssignRepairDto,
  ) {
    return this.issueRepairService.assignProviderToRepair(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Patch('repairs/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateRepairStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateRepairStatusDto,
  ) {
    return this.issueRepairService.updateRepairStatus(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
  }
}

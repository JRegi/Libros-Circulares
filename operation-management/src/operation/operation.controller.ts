import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { OperationService } from './operation.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateOwnershipTransferDto } from './dto/create-ownership-transfer.dto';
import { CreateDecommissionDto } from './dto/create-decommission.dto';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Post('loan')
  loan(@Body() createLoanDto: CreateLoanDto) {
    return this.operationService.loan(createLoanDto);
  }

  @Post('return')
  return(@Body() createReturnDto: CreateReturnDto) {
    return this.operationService.return(createReturnDto);
  }

  @Post('ownership-transfer')
  transferOwnership(
    @Body() createOwnershipTransferDto: CreateOwnershipTransferDto,
  ) {
    return this.operationService.transferOwnership(createOwnershipTransferDto);
  }

  @Post('decommission')
  decommission(@Body() createDecommissionDto: CreateDecommissionDto) {
    return this.operationService.decommission(createDecommissionDto);
  }

  @Get()
  findAll() {
    return this.operationService.findAll();
  }

  // Declared before ':id' so that "open" is not parsed as an id.
  @Get('open')
  hasOpenOperations(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('communityId', new ParseIntPipe({ optional: true }))
    communityId?: number,
  ) {
    return {
      hasOpenOperations: this.operationService.hasOpenOperations(
        userId,
        communityId,
      ),
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.operationService.findOne(id);
  }
}

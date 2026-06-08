import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateTestItemDto } from './dto/create-test-item.dto';
import { UpdateTestItemDto } from './dto/update-test-item.dto';
import { TestItemsService } from './test-items.service';

@ApiTags('test-items')
@Controller('test-items')
export class TestItemsController {
  constructor(private readonly service: TestItemsService) {}

  @Get()
  @ApiOperation({ summary: '시험항목 목록 조회' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'mandatory', required: false })
  @ApiQuery({ name: 'productLine', required: false })
  findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('mandatory') mandatory?: string,
    @Query('productLine') productLine?: string,
  ) {
    return this.service.findAll({ category, status, mandatory, productLine });
  }

  @Get(':id')
  @ApiOperation({ summary: '시험항목 단건 조회' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '시험항목 신규 등록' })
  create(@Body() dto: CreateTestItemDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '시험항목 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateTestItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '시험항목 삭제' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

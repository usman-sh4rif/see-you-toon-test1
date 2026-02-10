import { Controller, Get, Post, Body, Param, Put, Delete, Query, Res, HttpStatus, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly svc: CategoryService) {}

  @Get()
  async list() {
    return await this.svc.list();
  }

  @Get('stream')
  async stream(@Res() res: Response, @Req() req: Request) {
    // implement Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (payload: any) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {}
    };

    // send initial state
    send({ type: 'init', categories: await this.svc.list() });

    const unsub = this.svc.subscribeSse(send);

    req.on('close', () => {
      try {
        unsub();
      } catch (err) {}
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const it = await this.svc.get(id);
    if (!it) {
      return { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' };
    }
    return it;
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    try {
      const created = await this.svc.create(dto);
      return { statusCode: HttpStatus.CREATED, data: created };
    } catch (err) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: err.message };
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const updated = await this.svc.update(id, dto);
    if (!updated) return { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' };
    return { statusCode: HttpStatus.OK, data: updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('reassignTo') reassignTo?: string) {
    const result = await this.svc.remove(id, reassignTo);
    if (!result || result.success === false) return { statusCode: HttpStatus.NOT_FOUND, message: result?.message || 'Not found' };
    return { statusCode: HttpStatus.OK, data: result };
  }

  @Post(':id/enable')
  async enable(@Param('id') id: string) {
    const res = await this.svc.enable(id);
    if (!res) return { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' };
    return { statusCode: HttpStatus.OK, data: res };
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string) {
    const res = await this.svc.disable(id);
    if (!res) return { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' };
    return { statusCode: HttpStatus.OK, data: res };
  }

  @Post('reorder')
  async reorder(@Body() body: { order: string[] }) {
    if (!body || !Array.isArray(body.order)) return { statusCode: HttpStatus.BAD_REQUEST, message: 'order array required' };
    const list = await this.svc.reorder(body.order);
    return { statusCode: HttpStatus.OK, data: list };
  }

  @Post('bulk/toggle')
  async bulkToggle(@Body() body: { ids: string[]; active: boolean }) {
    if (!body || !Array.isArray(body.ids)) return { statusCode: HttpStatus.BAD_REQUEST, message: 'ids array required' };
    const updated = await this.svc.bulkToggle(body.ids, !!body.active);
    return { statusCode: HttpStatus.OK, data: updated };
  }
}

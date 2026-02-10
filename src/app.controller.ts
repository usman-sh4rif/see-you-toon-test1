import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('side-route/:id')
  sideRoute(@Param('id') id: string): string {
    return `Provided Param is ${id}`;
  }

  @Get('admin')
  admin(@Res() res: Response) {
    try {
      const p = path.join(process.cwd(), 'public', 'admin', 'index.html');
      const html = fs.readFileSync(p, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      res.status(404).send('Admin UI not found');
    }
  }

  @Get('admin/:asset')
  asset(@Param('asset') asset: string, @Res() res: Response) {
    try {
      const p = path.join(process.cwd(), 'public', 'admin', asset);
      if (!fs.existsSync(p)) return res.status(404).send('Not found');
      const ext = path.extname(p).toLowerCase();
      const map: Record<string,string> = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
      const ct = map[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', ct);
      const buf = fs.readFileSync(p);
      res.send(buf);
    } catch (err) {
      res.status(500).send('Error');
    }
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  @Get('ping')
  @ApiOperation({ summary: 'Health check / Keep awake' })
  ping() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    };
  }
}
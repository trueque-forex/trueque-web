import { Controller, Get } from '@nestjs/common';

@Controller('rate-integrity')
export class RateIntegrityController {
  @Get()
  getRates() {
    return []; // stub
  }
}
}

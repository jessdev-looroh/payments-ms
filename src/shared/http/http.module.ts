// src/shared/http/http.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  exports: [HttpModule],
})
export class SharedHttpModule {}

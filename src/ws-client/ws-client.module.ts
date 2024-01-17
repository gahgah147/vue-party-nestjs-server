import { Module } from '@nestjs/common';
import { WsClientService } from './ws-client.service';
import { WsClientGateway } from './ws-client.gateway';

@Module({
  providers: [WsClientGateway, WsClientService],
  exports: [WsClientService],
})
export class WsClientModule {}

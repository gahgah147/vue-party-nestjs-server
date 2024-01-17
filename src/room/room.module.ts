import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { WsClientModule } from 'src/ws-client/ws-client.module';

@Module({
  imports: [WsClientModule],
  providers: [RoomGateway, RoomService],
  exports: [RoomService],
})
export class RoomModule {}

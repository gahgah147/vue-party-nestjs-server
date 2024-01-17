import { Module } from '@nestjs/common';
import { GameConsoleService } from './game-console.service';
import { GameConsoleGateway } from './game-console.gateway';
import { WsClientModule } from 'src/ws-client/ws-client.module';
import { RoomModule } from 'src/room/room.module';

@Module({
  imports: [WsClientModule, RoomModule],
  providers: [GameConsoleGateway, GameConsoleService],
  exports: [GameConsoleService],
})
export class GameConsoleModule {
  //
}

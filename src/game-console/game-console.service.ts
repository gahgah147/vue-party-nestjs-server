import { Injectable, Logger } from '@nestjs/common';
import { cloneDeep, defaultsDeep } from 'lodash';
import { RoomService } from 'src/room/room.service';
import { WsClientService } from 'src/ws-client/ws-client.service';
import { GameConsoleState, Player } from './game-console.type';
import { EmitEvents, OnEvents } from 'types';
import { Server } from 'socket.io';

/** GameConsoleService 儲存之狀態不需包含 players
 * 因為 players 數值由 roomService 提供，不須重複儲存，所以這裡忽略
 */
type GameConsoleData = Omit<GameConsoleState, 'players'>;

const defaultState: GameConsoleData = {
  status: 'home',
  gameName: undefined,
};

@Injectable()
export class GameConsoleService {
  private logger: Logger = new Logger(GameConsoleService.name);
  /** key 為 founder 之 clientId */
  private readonly gameConsolesMap = new Map<string, GameConsoleData>();

  constructor(
    private readonly roomService: RoomService,
    private readonly wsClientService: WsClientService,
  ) {
    //
  }

  setState(founderId: string, state: Partial<GameConsoleData>) {
    const oriState = this.gameConsolesMap.get(founderId);

    const newState: GameConsoleData = defaultsDeep(
      state,
      oriState,
      defaultState,
    );

    this.gameConsolesMap.set(founderId, newState);
  }

  getState(founderId: string) {
    /** 使用 cloneDeep 複製物件，以免原始物件被意外修改 */
    const data = cloneDeep(this.gameConsolesMap.get(founderId));

    // 取得房間
    const room = this.roomService.getRoom({
      founderId,
    });
    if (!room) {
      return undefined;
    }

    // 加入玩家
    const players: Player[] = room.playerIds.map((playerId) => ({
      clientId: playerId,
    }));

    const state: GameConsoleState = defaultsDeep(data, {
      status: 'home',
      players,
    });

    return state;
  }

  async broadcastState(
    founderId: string,
    server: Server<OnEvents, EmitEvents>,
  ) {
    const room = this.roomService.getRoom({
      founderId,
    });

    if (!room) {
      this.logger.warn(`此 founderId 未建立任何房間 : ${founderId}`);
      return;
    }

    const state = this.getState(founderId);
    console.log(`🚀 ~ [broadcastState] state:`, state);
    if (!state) {
      this.logger.warn(`此 founderId 不存在 state : ${founderId}`);
      return;
    }

    const sockets = await server.in(room.id).fetchSockets();
    sockets.forEach((socketItem) => {
      socketItem.emit('game-console:state-update', state);
    });
  }
}

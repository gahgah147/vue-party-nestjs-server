import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { GameConsoleService } from './game-console.service';
import { UtilsService } from 'src/utils/utils.service';
import { WsClientService } from 'src/ws-client/ws-client.service';
import { Logger } from '@nestjs/common';
import {
  ClientSocket,
  EmitEvents,
  GamepadData,
  OnEvents,
  SocketResponse,
} from 'types';
import {
  GameConsoleState,
  Player,
  UpdateGameConsoleState,
} from './game-console.type';
import { Server } from 'socket.io';
import { RoomService } from 'src/room/room.service';

@WebSocketGateway()
export class GameConsoleGateway {
  private logger: Logger = new Logger(GameConsoleGateway.name);
  /** 使用 WebSocketServer 裝飾器取得 WebSocket Server */
  @WebSocketServer()
  private server!: Server<OnEvents, EmitEvents>;

  constructor(
    private readonly gameConsoleService: GameConsoleService,
    private readonly utilsService: UtilsService,
    private readonly wsClientService: WsClientService,
    private readonly roomService: RoomService,
  ) {
    //
  }

  @SubscribeMessage<keyof OnEvents>('game-console:state-update')
  async handleGameConsoleStateUpdate(
    socket: ClientSocket,
    state: UpdateGameConsoleState,
  ) {
    const client = this.wsClientService.getClient({
      socketId: socket.id,
    });
    if (!client) return;

    const { status, gameName } = state;

    this.gameConsoleService.setState(client.id, { status, gameName });

    // 廣播狀態
    this.gameConsoleService.broadcastState(client.id, this.server);
  }

  @SubscribeMessage<keyof OnEvents>('player:request-game-console-state')
  async handleRequestState(socket: ClientSocket) {
    const client = this.wsClientService.getClient({
      socketId: socket.id,
    });
    if (!client) {
      const result: SocketResponse = {
        status: 'err',
        message: '此 socket 不存在 client',
      };
      return result;
    }

    const room = this.roomService.getRoom({
      playerId: client.id,
    });
    if (!room) {
      const result: SocketResponse = {
        status: 'err',
        message: 'client 未加入任何房間',
      };
      return result;
    }

    const state = this.gameConsoleService.getState(room.founderId);
    if (!state) {
      const result: SocketResponse = {
        status: 'err',
        message: '此房間之 game-console 不存在 state',
      };
      return result;
    }

    socket.emit('game-console:state-update', state);

    const result: SocketResponse<GameConsoleState> = {
      status: 'suc',
      message: '取得 state 成功',
      data: state,
    };
    return result;
  }

  @SubscribeMessage<keyof OnEvents>('player:gamepad-data')
  async handlePlayerGamepadData(socket: ClientSocket, data: GamepadData) {
    const client = this.wsClientService.getClient({ socketId: socket.id });
    if (!client) {
      const result: SocketResponse = {
        status: 'err',
        message: '此 socket 不存在 client',
      };
      return result;
    }

    const room = this.roomService.getRoom({ playerId: client.id });
    if (!room) {
      const result: SocketResponse = {
        status: 'err',
        message: 'client 未加入任何房間',
      };
      return result;
    }

    const founderClient = this.wsClientService.getClient({
      clientId: room.founderId,
    });
    if (!founderClient) {
      const result: SocketResponse = {
        status: 'err',
        message: '此 socket 不存在 client',
      };
      return result;
    }

    const targetSocket = this.server.sockets.sockets.get(
      founderClient.socketId,
    );
    if (!targetSocket) {
      const result: SocketResponse = {
        status: 'err',
        message: '不存在 room founder 對應之 Client',
      };
      return result;
    }

    targetSocket.emit('player:gamepad-data', data);

    const result: SocketResponse = {
      status: 'suc',
      message: '傳輸搖桿資料成功',
      data: undefined,
    };
    return result;
  }

  @SubscribeMessage<keyof OnEvents>('player:profile')
  async handlePlayerProfile(socket: ClientSocket, data: Player) {
    const client = this.wsClientService.getClient({ socketId: socket.id });
    if (!client) {
      const result: SocketResponse = {
        status: 'err',
        message: '此 socket 不存在 client',
      };
      return result;
    }

    const room = this.roomService.getRoom({ playerId: client.id });
    if (!room) {
      const result: SocketResponse = {
        status: 'err',
        message: 'client 未加入任何房間',
      };
      return result;
    }

    const founderClient = this.wsClientService.getClient({
      clientId: room.founderId,
    });
    if (!founderClient) {
      const result: SocketResponse = {
        status: 'err',
        message: '此 socket 不存在 client',
      };
      return result;
    }

    /** 發送至遊戲機網頁 */
    const targetSocket = this.server.sockets.sockets.get(
      founderClient.socketId,
    );
    if (!targetSocket) {
      const result: SocketResponse = {
        status: 'err',
        message: '不存在 room founder 對應之 Client',
      };
      return result;
    }
    targetSocket.emit('game-console:profile-update', data);

    const result: SocketResponse = {
      status: 'suc',
      message: '傳輸資料成功',
      data: undefined,
    };
    return result;
  }
}

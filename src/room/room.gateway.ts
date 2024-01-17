import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Room, RoomService } from './room.service';
import { Server } from 'socket.io';
import { UtilsService } from 'src/utils/utils.service';
import { WsClientService } from 'src/ws-client/ws-client.service';
import { ClientSocket, EmitEvents, OnEvents, SocketResponse } from 'types';
import { Logger } from '@nestjs/common';
import to from 'await-to-js';

@WebSocketGateway()
export class RoomGateway {
  private logger: Logger = new Logger(RoomGateway.name);
  @WebSocketServer()
  private server!: Server<OnEvents, EmitEvents>;

  constructor(
    private readonly roomService: RoomService,
    private readonly utilsService: UtilsService,
    private readonly wsClientService: WsClientService,
  ) {
    //
  }

  handleConnection(socket: ClientSocket) {
    const queryData = socket.handshake.query;

    if (!this.utilsService.isSocketQueryData(queryData)) return;

    const { clientId, type } = queryData;

    /** 只有 game-console 才建立房間 */
    if (type !== 'game-console') return;

    const room = this.roomService.addRoom(clientId);

    /** 加入 Socket.IO 提供的 room 功能，
     * 這樣可以簡單輕鬆的對所有成員廣播資料
     *
     * https://socket.io/docs/v4/rooms/#default-room
     */
    socket.join(room.id);

    /** 發送房間建立成功事件 */
    socket.emit('game-console:room-created', room);
  }
  handleDisconnect(socket: ClientSocket) {
    const client = this.wsClientService.getClient({
      socketId: socket.id,
    });
    if (!client) return;

    if (client.type === 'game-console') {
      this.roomService.deleteRooms(client.id);
      return;
    }

    if (client.type === 'player') {
      // 取得此玩家所處房間
      const room = this.roomService.getRoom({ playerId: client.id });

      this.roomService.deletePlayer(client.id);

      // 若房間存在則發送玩家資料更新
      if (room) {
        this.roomService.emitPlayers(room.founderId, this.server);
      }
      return;
    }
  }

  @SubscribeMessage<keyof OnEvents>('player:join-room')
  async handlePlayerJoinRoom(
    socket: ClientSocket,
    roomId: string,
  ): Promise<SocketResponse<Room>> {
    this.logger.log(`socketId : ${socket.id}`);
    this.logger.log(`roomId : `, roomId);

    if (!this.roomService.hasRoom(roomId)) {
      const result: SocketResponse = {
        status: 'err',
        message: '指定房間不存在',
      };
      return result;
    }

    const client = this.wsClientService.getClient({
      socketId: socket.id,
    });
    if (!client) {
      const result: SocketResponse = {
        status: 'err',
        message: 'Socket Client 不存在，請重新連線',
      };
      return result;
    }

    const [err, room] = await to(this.roomService.joinRoom(roomId, client.id));
    if (err) {
      const result: SocketResponse = {
        status: 'err',
        message: '加入房間發生異常',
        error: err,
      };
      return result;
    }

    // 加入 socket room
    socket.join(roomId);

    // 發送玩家資料更新
    this.roomService.emitPlayers(room.founderId, this.server);

    const result: SocketResponse<Room> = {
      status: 'suc',
      message: '成功加入房間',
      data: room,
    };

    return result;
  }
}

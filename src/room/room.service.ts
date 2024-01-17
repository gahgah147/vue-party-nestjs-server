import { Injectable, Logger } from '@nestjs/common';
import { ClientId, WsClientService } from 'src/ws-client/ws-client.service';
import { Server } from 'socket.io';

import { customAlphabet } from 'nanoid';
import { EmitEvents, OnEvents } from 'types';
const createRoomId = customAlphabet('1234567890', 6);

/** 房間 ID，6 位數字組成 */
export type RoomId = string;

export interface Room {
  /** 房間 ID，6 位數字組成 */
  id: RoomId;
  founderId: ClientId;
  playerIds: ClientId[];
}

export type GetRoomParams = { founderId: string } | { playerId: string };

@Injectable()
export class RoomService {
  private logger: Logger = new Logger(RoomService.name);
  /** 紀錄已建立的房間 */
  roomsMap = new Map<RoomId, Room>();

  constructor(private readonly wsClientService: WsClientService) {
    //
  }

  addRoom(clientId: string) {
    let roomId = createRoomId();
    while (this.roomsMap.has(roomId)) {
      roomId = createRoomId();
    }

    const newRoom = {
      id: roomId,
      founderId: clientId,
      playerIds: [],
    };
    this.roomsMap.set(roomId, newRoom);
    this.logger.log(`created room : `, newRoom);

    return newRoom;
  }

  getRoom(params: GetRoomParams) {
    const result = [...this.roomsMap.values()].find((room) => {
      if ('founderId' in params) {
        return room.founderId === params.founderId;
      }

      return room.playerIds.includes(params.playerId);
    });

    return result;
  }

  hasRoom(roomId: string) {
    return this.roomsMap.has(roomId);
  }

  async joinRoom(roomId: string, clientId: string) {
    const room = this.roomsMap.get(roomId);

    if (!room) {
      return Promise.reject(`不存在 ID 為 ${roomId} 的房間`);
    }

    const isJoined = room.playerIds.includes(clientId);
    if (isJoined) {
      return room;
    }

    room.playerIds.push(clientId);
    return room;
  }

  deleteRooms(founderId: string) {
    const rooms = [...this.roomsMap.values()].filter(
      (room) => room.founderId === founderId,
    );

    rooms.forEach(({ id }) => {
      this.roomsMap.delete(id);
    });
  }

  deletePlayer(clientId: string) {
    this.roomsMap.forEach((room, key) => {
      const index = room.playerIds.indexOf(clientId);
      if (index < 0) return;

      room.playerIds.splice(index, 1);
      this.roomsMap.set(key, room);
    });
  }

  /** 發送指定房間之玩家資料*/
  async emitPlayers(founderId: string, server: Server<OnEvents, EmitEvents>) {
    const room = this.getRoom({ founderId });
    if (!room) return;

    const players = room.playerIds.map((playerId) => ({
      clientId: playerId,
    }));

    // 對房間內所有人發送
    server.to(room.id).emit('game-console:player-update', players);
  }
}

import { Injectable } from '@nestjs/common';

export enum ClientType {
  /** 遊戲機，負責建立派對房間 */
  GAME_CONSOLE = 'game-console',
  /** 玩家，通常是手機端網頁 */
  PLAYER = 'player',
}

export type ClientId = string;

export interface Client {
  id: ClientId;
  socketId: string;
  type: `${ClientType}`;
}

export interface PutClientParams {
  socketId: string;
  clientId: ClientId;
  type: `${ClientType}`;
}

/** 允許使用 socketId 或 clientId 取得 */
export type GetClientParams = { socketId: string } | { clientId: string };

@Injectable()
export class WsClientService {
  clientsMap = new Map<ClientId, Client>();

  /** 不存在則新增，存在則更新 */
  putClient(params: PutClientParams) {
    const { clientId, socketId, type } = params;

    const client = this.clientsMap.get(clientId);

    // 新增
    if (!client) {
      const newClient = { id: clientId, socketId, type };
      this.clientsMap.set(clientId, newClient);
      return newClient;
    }

    // 更新
    client.socketId = socketId;
    client.type = type;

    this.clientsMap.set(clientId, client);

    return client;
  }

  getClient(params: GetClientParams) {
    // 存在 clientId，使用 clientId 取得
    if ('clientId' in params) {
      return this.clientsMap.get(params.clientId);
    }

    // 否則用 socketId 查詢
    const clients = [...this.clientsMap.values()];
    const target = clients.find(({ socketId }) => socketId === params.socketId);
    return target;
  }
}

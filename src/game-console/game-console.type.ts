export enum GameConsoleStatus {
  /** 首頁 */
  HOME = 'home',
  /** 大廳等待中 */
  LOBBY = 'lobby',
  /** 遊戲中 */
  PLAYING = 'playing',
}

/** PermissionState 是 Web 內建定義 */
export type PlayerPermissionState = PermissionState | 'not-support';

export interface PlayerPermission {
  gyroscope: PlayerPermissionState;
}

/** 玩家 */
export interface Player {
  /** 唯一 ID */
  readonly clientId: string;
  /** 表示玩家手機端允許的 API 清單 */
  permission?: PlayerPermission;
}

export interface GameConsoleState {
  status: `${GameConsoleStatus}`;
  gameName?: string;
  players: Player[];
}

export type UpdateGameConsoleState = Partial<GameConsoleState>;

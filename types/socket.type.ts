import { Socket } from 'socket.io';
import {
  UpdateGameConsoleState,
  GameConsoleState,
  Player,
} from 'src/game-console/game-console.type';
import { Room } from 'src/room/room.service';
import { GamepadData } from 'types';

export interface OnEvents {
  'player:join-room': (data: Room) => void;
  'player:request-game-console-state': () => void;
  'player:gamepad-data': (data: GamepadData) => void;
  'player:profile': (data: Player) => void;

  'game-console:state-update': (data: UpdateGameConsoleState) => void;
}

export interface EmitEvents {
  'player:gamepad-data': (data: GamepadData) => void;

  'game-console:room-created': (data: Room) => void;
  'game-console:state-update': (data: GameConsoleState) => void;
  'game-console:player-update': (data: Player[]) => void;
  'game-console:profile-update': (data: Player) => void;
}

export type SocketResponse<T = undefined> = ErrResponse | SucResponse<T>;
type ErrResponse = {
  status: 'err';
  message: string;
  error?: any;
};
type SucResponse<T> = {
  status: 'suc';
  message: string;
  data: T;
};

export type ClientSocket = Socket<OnEvents, EmitEvents>;

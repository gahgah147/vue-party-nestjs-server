/** 按鍵類型 */
export enum KeyName {
  UP = 'up',
  LEFT = 'left',
  RIGHT = 'right',
  DOWN = 'down',

  CONFIRM = 'confirm',
}

/** 數位訊號
 *
 * 只有開和關兩種狀態
 */
export interface DigitalData {
  name: `${KeyName}`;
  value: boolean;
}

/** 類比訊號
 *
 * 連續數字組成的訊號，例如：類比搖桿、姿態感測器訊號等等
 */
export interface AnalogData {
  name: `${KeyName}`;
  value: number;
}

export type SignalData = DigitalData | AnalogData;

/** 搖桿資料 */
export interface GamepadData {
  playerId: string;
  keys: SignalData[];
}

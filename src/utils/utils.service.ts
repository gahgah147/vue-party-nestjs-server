import { Injectable } from '@nestjs/common';
import { ClientType } from 'src/ws-client/ws-client.service';

interface SocketQueryData {
  clientId: string;
  type: `${ClientType}`;
}

@Injectable()
export class UtilsService {
  isSocketQueryData(data: any): data is SocketQueryData {
    // 沒有必要屬性
    if (!('clientId' in data) || !('type' in data)) {
      return false;
    }

    // type 不屬於列舉類型
    if (!Object.values(ClientType).includes(data['type'])) {
      return false;
    }

    return true;
  }
}

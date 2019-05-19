import Global = NodeJS.Global;
export interface customGlobal extends Global {
  WebSocket: any
}
declare const global: customGlobal;

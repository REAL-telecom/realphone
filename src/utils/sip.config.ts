const domain = 'cityonline.real.su';

export const nameAlice = '3000';
export const uriAlice = 'sip:3000' + '@' + domain;
export const passwordAlice = '30906cb3a5451f7e91bc9ae0596345b3';
export const webSocketServerAlice = 'wss://cityonline.real.su:8089/ws';

export const nameBob = '4000';
export const uriBob = 'sip:4000' + '@' + domain;
export const passwordBob = 'c2c661d3f8a4b06dad539e6469694dea';
export const webSocketServerBob = 'wss://cityonline.real.su:8089/ws';

export const RTC_CONFIG = {
  iceServers: [
    // STUN сервер
    { urls: 'stun:hosting4.astrakhan.ru:3478' },
    // TURN UDP (основной)
    {
      urls: 'turn:hosting4.astrakhan.ru:3478?transport=udp',
      username: 'test',
      credential: 'tetest',
    },
    // TURN TCP (резервный)
    {
      urls: 'turn:hosting4.astrakhan.ru:3478?transport=tcp',
      username: 'test',
      credential: 'tetest',
    },
  ],
};

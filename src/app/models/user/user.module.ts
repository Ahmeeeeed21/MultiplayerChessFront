export interface User {
  id: number;
  username: string;
  email: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME';
}

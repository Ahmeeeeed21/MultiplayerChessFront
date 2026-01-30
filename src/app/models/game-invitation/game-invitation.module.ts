import {User} from "../user/user.module";

export interface GameInvitation {
  id: number;
  sender: User;
  receiver: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: Date;
}

export class User {
    name: string;
    userName: string;
    avatar: string;
  
    public constructor(init?:Partial<User>) {
      Object.assign(this, init);
    }
  }
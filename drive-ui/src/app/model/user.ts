export class User {
  name: string | undefined
  userName: string | undefined
  avatar: string | undefined

  public constructor(init?:Partial<User>) {
    Object.assign(this, init)
  }
}
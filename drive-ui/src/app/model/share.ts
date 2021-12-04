export class Share {
  id: string
  file: string

  expiration: string
  created: string

  creatorId: string
  creatorName: string

  public constructor(init?:Partial<Share>) {
    Object.assign(this, init);
  }
}

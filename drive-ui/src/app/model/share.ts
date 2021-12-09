export class Share {
  id: string
  name: string
  file: string

  writeAccess: boolean
  expiration: string
  created: string

  creatorId: string
  creatorName: string

  public constructor(init?:Partial<Share>) {
    Object.assign(this, init);
  }
}

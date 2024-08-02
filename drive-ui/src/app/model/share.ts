export class Share {
  id: string | undefined
  name: string | undefined
  path: string | undefined

  writeAccess: boolean | undefined
  expiration: string | undefined
  created: string | undefined

  creatorId: string | undefined
  creatorName: string | undefined

  public constructor(init?:Partial<Share>) {
    Object.assign(this, init)
  }
}

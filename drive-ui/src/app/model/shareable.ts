export class Shareable {
  name: string | undefined
  path: string | undefined
  isFile: boolean | undefined
  created: number | undefined
  lastModified: number | undefined
  size: number | undefined

  type: string | undefined
  icon: string | undefined

  public constructor(init?:Partial<Shareable>) {
    Object.assign(this, init)
  }
}

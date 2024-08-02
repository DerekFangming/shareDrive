export class DirectorySize {
  size: number | undefined

  public constructor(init?:Partial<DirectorySize>) {
    Object.assign(this, init)
  }
}
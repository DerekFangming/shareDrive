export class Capacity {
  totalSpace: number | undefined
  availableSpace: number | undefined
  ratio: string | undefined

  public constructor(init?:Partial<Capacity>) {
    Object.assign(this, init)
  }
}

export class Capacity {
  totalSpace: number;
  availableSpace: number;
  ratio: string;

  public constructor(init?:Partial<Capacity>) {
    Object.assign(this, init);
  }
}

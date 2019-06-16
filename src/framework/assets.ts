import { ContentProvider } from '@rbxts/services';

export class Assets {
  private queue: Instance[];

  constructor() {
    this.queue = [];
  }

  public load(): void {
    ContentProvider.PreloadAsync(this.queue);
    this.queue = [];
  }

  public loadImage(id: string, width: number, height: number): ImageLabel {
    let i: ImageLabel = new Instance('ImageLabel');
    i.Image = id;
    i.Size = new UDim2(0, width, 0, height);
    this.queue.push(i);
    return i;
  }

  public loadSound(id: string): Sound {
    let s: Sound = new Instance('Sound');
    s.SoundId = id;
    this.queue.push(s);
    return s;
  }
}

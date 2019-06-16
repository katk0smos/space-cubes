import { Workspace, Players, RunService } from '@rbxts/services';

const PlayerGui: PlayerGui = Players.LocalPlayer!.WaitForChild('PlayerGui');

/*
 * Graphics.xxxxx(x, y, w, h) ->
 *  go to .frames (or whatever array is used for that instance)
 *  index using .xxxxxxIndex
 *  check if it exists
 *    if it does: reuse
 *    if it doesn't: create new
 *
 * Graphics.draw() ->
 *  go through all of the arrays
 *   for each array:
 *    1 - compare its index to the length
 *    2 - remove any instances after and including the index until the end of the array
 */

const SCREEN_SIZE: Vector2 = RunService.IsClient() ? (Workspace.CurrentCamera!.ViewportSize) : (new Vector2(0, 0));

export enum ScalingMode {
  FillX, FillY, Stretch,
  LeftTop, CenterTop, RightTop,
  LeftMiddle, Center, RightMiddle,
  LeftBottom, CenterBottom, RightBottom,
}

function isUDim2(x: unknown): x is UDim2 {
  if (!x) return false;
  return ((<{[k: string]: unknown}>x).X! !== undefined && (<{[k: string]: unknown}>x).Y! !== undefined && (<{[k: string]: unknown}>x).Width !== undefined && (<{[k: string]: unknown}>x).Height !== undefined);
}

function isVector2(x: unknown): x is Vector2 {
  return ((<{[k: string]: unknown}>x).X !== undefined && (<{[k: string]: unknown}>x).Y !== undefined && (<{[k: string]: unknown}>x).Magnitude !== undefined && (<{[k: string]: unknown}>x).Unit !== undefined);
}

export class Graphics {
  // ScreenGUI
  public readonly gui: ScreenGui;
  public readonly background: Frame;
  public readonly display: Frame;

  // instances used last frame
  private frames: Frame[];
  private imageLabels: ImageLabel[];
  private imageButtons: ImageButton[];
  private textBoxes: TextBox[];
  private textLabels: TextLabel[];
  private textButtons: TextButton[];

  // index of next instance to use
  private framesIndex: number;
  private imageLabelsIndex: number;
  private imageButtonsIndex: number;
  private textBoxesIndex: number;
  private textLabelsIndex: number;
  private textButtonsIndex: number;

  private zIndex: number;

  private width: number;
  private height: number;
  private mode: ScalingMode;

  private drawColor: Color3;
  private backgroundColor: Color3;

  public constructor() {
    this.frames = [];
    this.imageLabels = [];
    this.imageButtons = [];
    this.textBoxes = [];
    this.textLabels = [];
    this.textButtons = [];

    this.framesIndex = 0;
    this.imageLabelsIndex = 0;
    this.imageButtonsIndex = 0;
    this.textBoxesIndex = 0;
    this.textLabelsIndex = 0;
    this.textButtonsIndex = 0;

    this.zIndex = 2;
    this.mode = ScalingMode.FillY;

    this.width = SCREEN_SIZE.X;
    this.height = SCREEN_SIZE.Y;

    this.drawColor = new Color3(1,1,1);
    this.backgroundColor = new Color3(0,0,0);

    this.gui = new Instance('ScreenGui');
    this.gui.Name = 'FrameworkDisplay';
    this.gui.Parent = PlayerGui;

    this.display = new Instance('Frame');
    this.display.Size = new UDim2(0, this.width, 0, this.height);
    this.display.BackgroundTransparency = 0;
    this.display.BackgroundColor3 = this.backgroundColor;
    this.display.BorderColor3 = this.backgroundColor;
    this.display.BorderSizePixel = 0;
    this.display.ClipsDescendants = true;
    this.refreshDisplayMode();
    this.display.Parent = this.gui;

    {
      this.background = new Instance('Frame');
      this.background.BackgroundColor3 = this.backgroundColor;
      this.background.BackgroundTransparency = 0;
      this.background.BorderSizePixel = 0;
      this.background.BorderColor3 = this.backgroundColor;
      this.background.Size = new UDim2(1, 0, 1, 50);
      this.background.Position = new UDim2(0, 0, 0, -50);
      this.background.Parent = this.gui;
    }
  }

  public setSize(s: number | UDim2 | Vector2 = 0, y: number = 0): void {
    if (isUDim2(s)) {
      this.width = (s.X.Scale*SCREEN_SIZE.X) + s.X.Offset;
      this.height = (s.Y.Scale*SCREEN_SIZE.Y) + s.Y.Offset;
    } else if (isVector2(s)) {
      this.width = s.X;
      this.height = s.Y;
    } else {
      this.width = s;
      this.height = y;
    }
    this.refreshDisplayMode();
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public setMode(m: ScalingMode): void {
    this.mode = m;
    this.refreshDisplayMode();
  }

  public setColor(col: Color3): void {
    this.drawColor = col;
  }

  public setBackgroundColor(col: Color3): void {
    this.backgroundColor = col;

    this.display.BackgroundColor3 = this.backgroundColor;
    this.display.BorderColor3 = this.backgroundColor;

    this.background.BackgroundColor3 = this.backgroundColor;
    this.background.BorderColor3 = this.backgroundColor;
  }

  public rect(x: number, y: number, w: number, h: number, r: number): void {
    print('drawing rect')
    let f: Frame = this.makeFrame();
    f.Position = new UDim2(x/this.width, 0, y/this.height, 0);
    f.Size = new UDim2(w/this.width, 0, h/this.height, 0);
    f.Rotation = r;
    this.zIndex++;
  }

  public image(image: ImageLabel, x: number, y: number, w: number = image.Size.X.Offset, h: number = image.Size.Y.Offset, r: number = 0, ox: number = 0, oy: number = 0, sx: number = image.Size.X.Offset, sy: number = image.Size.Y.Offset): void {
    print('drawing image')
    let f: ImageLabel = this.makeImageLabel(image);
    f.Position = new UDim2(x/this.width, 0, y/this.height, 0);
    f.Size = new UDim2(w/this.width, 0, h/this.height, 0);
    f.ImageRectOffset = new Vector2(ox, oy);
    f.ImageRectSize = new Vector2(sx, sy);
    f.Rotation = r;
    this.zIndex++;
  }

  public print(text: string, x: number, y: number, r: number = 0, fontSize: number = 14, width: number = this.width - x, xa: Enum.TextXAlignment = Enum.TextXAlignment.Left, ya: Enum.TextYAlignment = Enum.TextYAlignment.Top): void {
    let tl: TextLabel = this.makeTextLabel();
    tl.Text = text;
    tl.Position = new UDim2(x/this.width, 0, y/this.height, 0);
    tl.TextSize = fontSize;
    tl.Size = new UDim2(width/this.width, 0, fontSize/this.height, 0);
    tl.Rotation = r;
    tl.TextXAlignment = xa;
    tl.TextYAlignment = ya;
    this.zIndex++;
  }

  public beforeDraw(): void {
    this.zIndex = 2;
    this.framesIndex = 0;
    this.imageLabelsIndex = 0;
    this.imageButtonsIndex = 0;
    this.textBoxesIndex = 0;
    this.textLabelsIndex = 0;
    this.textButtonsIndex = 0;
  }

  public draw(): void {
    if (this.framesIndex < this.frames.size()) for (const o of this.frames.splice(this.framesIndex)) o.Destroy();
    if (this.imageLabelsIndex < this.imageLabels.size()) for (const o of this.imageLabels.splice(this.imageLabelsIndex)) o.Destroy();
    if (this.imageButtonsIndex < this.imageButtons.size()) for (const o of this.imageButtons.splice(this.imageButtonsIndex)) o.Destroy();
    if (this.textBoxesIndex < this.textBoxes.size()) for (const o of this.textBoxes.splice(this.textBoxesIndex)) o.Destroy();
    if (this.textLabelsIndex < this.textLabels.size()) for (const o of this.textLabels.splice(this.textLabelsIndex)) o.Destroy();
    if (this.textButtonsIndex < this.textButtons.size()) for (const o of this.textButtons.splice(this.textButtonsIndex)) o.Destroy();
  }

  private makeFrame(): Frame {
    let f: Frame;
    if (this.frames[this.framesIndex]) {
      f = this.frames[this.framesIndex++];
    } else {
      print('creating new frame');
      f = new Instance('Frame');
      f.Parent = this.display;
      this.frames[this.framesIndex++] = f;
    }
    f.ZIndex = this.zIndex;
    f.BackgroundTransparency = 0;
    f.BorderSizePixel = 0;
    f.BorderColor3 = this.drawColor;
    f.BackgroundColor3 = this.drawColor;
    f.Rotation = 0;
    return f;
  }

  private makeImageLabel(img: ImageLabel): ImageLabel {
    let il: ImageLabel;
    if (this.imageLabels[this.imageLabelsIndex]) {
      il = this.imageLabels[this.imageLabelsIndex++];
    } else {
      print('creating new image label');
      il = new Instance('ImageLabel');
      il.Parent = this.display;
      this.imageLabels[this.imageLabelsIndex++] = il;
    }
    il.ZIndex = this.zIndex;
    il.BackgroundTransparency = 1;
    il.BorderSizePixel = 0;
    il.BorderColor3 = this.drawColor;
    il.BackgroundColor3 = this.drawColor;
    il.ImageColor3 = this.drawColor;
    il.Image = img.Image;
    il.Size = new UDim2(img.Size.X.Offset/this.width, 0, img.Size.Y.Offset/this.height, 0);
    il.Rotation = 0;
    return il;
  }

  private makeTextLabel(): TextLabel {
    let tl: TextLabel;
    if (this.textLabels[this.textLabelsIndex]) {
      tl = this.textLabels[this.textLabelsIndex++];
    } else {
      print('creating new text label');
      tl = new Instance('TextLabel');
      tl.Parent = this.display;
      this.textLabels[this.textLabelsIndex++] = tl;
    }
    tl.ZIndex = this.zIndex;
    tl.BackgroundTransparency = 1;
    tl.BorderSizePixel = 0;
    tl.BorderColor3 = this.drawColor;
    tl.BackgroundColor3 = this.drawColor;
    tl.Rotation = 0;
    tl.TextScaled = false;
    tl.TextColor3 = this.drawColor;
    return tl;
  }

  private refreshDisplayMode(): void {
    let { width, height } = this;
    switch (this.mode) {
    case ScalingMode.FillY:
      this.display.Size = new UDim2(0, width, 1, 0);
      this.display.Position = new UDim2(0.5, -0.5*width, 0, 0);
      break;
    case ScalingMode.FillX:
      this.display.Size = new UDim2(1, 0, 0, height);
      this.display.Position = new UDim2(0, 0, 0.5, -0.5*height);
      break;
    case ScalingMode.Center:
      this.display.Size = new UDim2(0, this.width, 0, height);
      this.display.Position = new UDim2(0.5, -0.5*width, 0.5, -0.5*height);
      break;
    }
  }
}

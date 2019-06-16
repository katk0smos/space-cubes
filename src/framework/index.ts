import { RunService } from '@rbxts/services';
import { Assets } from './assets';
import { Input } from './input';
import * as Graphics from './graphics';
export * from './graphics';
import { InitHook, UpdateHook, DrawHook, CloseHook } from './hooks';

export const UPDATE_PRIORITY = Enum.RenderPriority.First;
export const DRAW_PRIORITY = Enum.RenderPriority.Last;
export let NumberOfFrameworks: number = 0;

export class Framework {
  public readonly graphics: Graphics.Graphics;
  public readonly assets: Assets;
  public readonly input: Input;
  private initHooks: Array<InitHook>;
  private updateHooks: Array<UpdateHook>;
  private drawHooks: Array<DrawHook>;
  private closeHooks: Array<CloseHook>;
  private frameworkNumber: number;
  private timeRunning: number;

  private hasInitialized: boolean = false;

  constructor() {
    this.graphics = new Graphics.Graphics();
    this.assets = new Assets();
    this.input = new Input(this);
    this.initHooks = [];
    this.updateHooks = [];
    this.drawHooks = [];
    this.closeHooks = [];
    this.timeRunning = 0;

    this.frameworkNumber = NumberOfFrameworks++;
  }

  public start(): void {
    this.timeRunning = 0;
    RunService.BindToRenderStep(`frameworkUpdate${this.frameworkNumber}`, UPDATE_PRIORITY.Value, (dt: number) => {
      this.onUpdate(dt);
      this.timeRunning += dt;
    });
    RunService.BindToRenderStep(`frameworkDraw${this.frameworkNumber}`, DRAW_PRIORITY.Value, (dt: number) => this.onDraw());
    this.onInit();
  }

  public stop(): void {
    RunService.UnbindFromRenderStep(`frameworkUpdate${this.frameworkNumber}`);
    RunService.UnbindFromRenderStep(`frameworkDraw${this.frameworkNumber}`);
    this.onClose();
  }

  private onInit(): void {
    this.hasInitialized = false;
    for (const hook of this.initHooks) {
      hook();
    }
    this.hasInitialized = true;
  }

  private onUpdate(dt: number): void {
    if (!this.hasInitialized) return;
    for (const hook of this.updateHooks) {
      hook(dt);
    }
  }

  private onDraw(): void {
    if (!this.hasInitialized) return;
    this.graphics.beforeDraw();
    for (const hook of this.drawHooks) {
      hook(this.graphics);
    }
    this.graphics.draw();
  }

  private onClose(): void {
    for (const hook of this.closeHooks) {
      hook(this.timeRunning);
    }
  }

  addInitHook(func: InitHook): void {
    this.initHooks.push(func);
  }

  removeInitHook(func: InitHook): void {
    let index: number = this.initHooks.indexOf(func);
    if (index > -1) this.initHooks.splice(index, 1);
  }

  addUpdateHook(func: UpdateHook): void {
    this.updateHooks.push(func);
  }

  removeUpdateHook(func: UpdateHook): void {
    let index: number = this.updateHooks.indexOf(func);
    if (index > -1) this.drawHooks.splice(index, 1);
  }

  addDrawHook(func: DrawHook): void {
    this.drawHooks.push(func);
  }

  removeDrawHook(func: DrawHook): void {
    let index: number = this.drawHooks.indexOf(func);
    if (index > -1) this.drawHooks.splice(index, 1);
  }

  addCloseHook(func: CloseHook): void {
    this.closeHooks.push(func);
  }

  removeCloseHook(func: CloseHook): void {
    let index: number = this.closeHooks.indexOf(func);
    if (index > -1) this.closeHooks.splice(index, 1);
  }
}

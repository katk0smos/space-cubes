import { UserInputService } from '@rbxts/services';
import { Framework } from './';

export const MouseButton = {
  Left: 1, Right: 2, Middle: 3
}

export type MousePressedHook = (x: number, y: number, button: number, isTouch: boolean) => void;
export type MouseReleasedHook = (x: number, y: number, button: number, isTouch: boolean) => void;
export type MouseMovedHook = (x: number, y: number, dx: number, dy: number, isTouch: boolean) => void;

function isMouseInput(io: InputObject): boolean {
  return io.UserInputType === Enum.UserInputType.MouseButton1
      || io.UserInputType === Enum.UserInputType.MouseButton2
      || io.UserInputType === Enum.UserInputType.MouseButton3
      || io.UserInputType === Enum.UserInputType.MouseMovement;
}

function isTouchInput(io: InputObject): boolean {
  return io.UserInputType === Enum.UserInputType.Touch;
}

export class Input {
  private mousePressedHooks: MousePressedHook[];
  private mouseReleasedHooks: MousePressedHook[];
  private mouseMovedHooks: MouseMovedHook[];

  constructor(private framework: Framework) {
    this.mousePressedHooks = [];
    this.mouseReleasedHooks = [];
    this.mouseMovedHooks = [];

    UserInputService.InputBegan.Connect((input: InputObject, gameProcessedEvent: boolean) => {
      if (isMouseInput(input) || isTouchInput(input)) {
        switch (input.UserInputType) {
          case Enum.UserInputType.MouseButton1: return this.onMousePressed(input.Position.X, input.Position.Y, 1,  false);
          case Enum.UserInputType.MouseButton2: return this.onMousePressed(input.Position.X, input.Position.Y, 2,  false);
          case Enum.UserInputType.MouseButton3: return this.onMousePressed(input.Position.X, input.Position.Y, 3,  false);
          case Enum.UserInputType.MouseMovement: return this.onMouseMoved(input.Position.X, input.Position.Y, input.Delta.X, input.Delta.Y, false);
        }
      } else {
        // keyboard/gamepad
      }
    });
    UserInputService.InputChanged.Connect((input: InputObject, gameProcessedEvent: boolean) => {
      if (isMouseInput(input) || isTouchInput(input)) {
        switch (input.UserInputType) {
          case Enum.UserInputType.MouseMovement: return this.onMouseMoved(input.Position.X, input.Position.Y, input.Delta.X, input.Delta.Y, false);
        }
      } else {
        // keyboard/gamepad
      }
    });
    UserInputService.InputEnded.Connect((input: InputObject, gameProcessedEvent: boolean) => {
      if (isMouseInput(input) || isTouchInput(input)) {
        switch (input.UserInputType) {
          case Enum.UserInputType.MouseButton1: return this.onMouseReleased(input.Position.X, input.Position.Y, 1,  false);
          case Enum.UserInputType.MouseButton2: return this.onMouseReleased(input.Position.X, input.Position.Y, 2,  false);
          case Enum.UserInputType.MouseButton3: return this.onMouseReleased(input.Position.X, input.Position.Y, 3,  false);
          case Enum.UserInputType.MouseMovement: return this.onMouseMoved(input.Position.X, input.Position.Y, input.Delta.X, input.Delta.Y, false);
        }
      } else {
        // keyboard/gamepad
      }
    });

    UserInputService.TouchStarted.Connect((touch: InputObject, gameProcessedEvent: boolean) => {
      if (isMouseInput(touch) || isTouchInput(touch)) {
        switch (touch.UserInputType) {
          case Enum.UserInputType.MouseButton1: return this.onMousePressed(touch.Position.X, touch.Position.Y, 1,  true);
          case Enum.UserInputType.MouseButton2: return this.onMousePressed(touch.Position.X, touch.Position.Y, 2,  true);
          case Enum.UserInputType.MouseButton3: return this.onMousePressed(touch.Position.X, touch.Position.Y, 3,  true);
          case Enum.UserInputType.MouseMovement: return this.onMouseMoved(touch.Position.X, touch.Position.Y, touch.Delta.X, touch.Delta.Y, true);
        }
      } else {
        // keyboard/gamepad
      }
    });
    UserInputService.TouchMoved.Connect((touch: InputObject, gameProcessedEvent: boolean) => {
      if (isMouseInput(touch) || isTouchInput(touch)) {
        switch (touch.UserInputType) {
          case Enum.UserInputType.MouseMovement: return this.onMouseMoved(touch.Position.X, touch.Position.Y, touch.Delta.X, touch.Delta.Y, true);
        }
      } else {
        // keyboard/gamepad
      }
    });
    UserInputService.TouchEnded.Connect((touch: InputObject, gameProcessedEvent: boolean) => {
      if (isMouseInput(touch) || isTouchInput(touch)) {
        switch (touch.UserInputType) {
          case Enum.UserInputType.MouseButton1: return this.onMouseReleased(touch.Position.X, touch.Position.Y, 1,  true);
          case Enum.UserInputType.MouseButton2: return this.onMouseReleased(touch.Position.X, touch.Position.Y, 2,  true);
          case Enum.UserInputType.MouseButton3: return this.onMouseReleased(touch.Position.X, touch.Position.Y, 3,  true);
          case Enum.UserInputType.MouseMovement: return this.onMouseMoved(touch.Position.X, touch.Position.Y, touch.Delta.X, touch.Delta.Y, true);
        }
      } else {
        // keyboard/gamepad
      }
    });
  }

  public isDown(...buttons: number[]): boolean {
    const pressed: number[] = UserInputService.GetMouseButtonsPressed().map((x: InputObject) => (<0 | 1 | 2>x.UserInputType.Value) + 1);
    for (const button of buttons) {
      if (pressed.indexOf(button) > -1) return true;
    }
    return false;
  }

  public addMousePressedHook(func: MousePressedHook): void {
    this.mousePressedHooks.push(func);
  }

  public removeMousePressedHook(func: MousePressedHook): void {
    let index: number = this.mousePressedHooks.indexOf(func);
    if (index > -1) this.mousePressedHooks.splice(index, 1);
  }

  private onMousePressed(x: number, y: number, button: number, isTouch: boolean): void {
    for (const hook of this.mousePressedHooks) {
      hook(x - this.framework.graphics.display.AbsolutePosition.X, y  - this.framework.graphics.display.AbsolutePosition.Y, button, isTouch);
    }
  }

  public addMouseReleasedHook(func: MouseReleasedHook): void {
    this.mouseReleasedHooks.push(func);
  }

  public removeMouseReleasedHook(func: MousePressedHook): void {
    let index: number = this.mouseReleasedHooks.indexOf(func);
    if (index > -1) this.mouseReleasedHooks.splice(index, 1);
  }

  private onMouseReleased(x: number, y: number, button: number, isTouch: boolean): void {
    for (const hook of this.mouseReleasedHooks) {
      hook(x - this.framework.graphics.display.AbsolutePosition.X, y  - this.framework.graphics.display.AbsolutePosition.Y, button, isTouch);
    }
  }

  public addMouseMovedHook(func: MouseMovedHook): void {
    this.mouseMovedHooks.push(func);
  }

  public removeMouseMovedHook(func: MouseMovedHook): void {
    let index: number = this.mouseMovedHooks.indexOf(func);
    if (index > -1) this.mouseMovedHooks.splice(index, 1);
  }

  private onMouseMoved(x: number, y: number, dx: number, dy: number, isTouch: boolean): void {
    for (const hook of this.mouseMovedHooks) {
      hook(x - this.framework.graphics.display.AbsolutePosition.X, y  - this.framework.graphics.display.AbsolutePosition.Y, dx, dy, isTouch);
    }
  }
}

import { Graphics } from './graphics';

export type InitHook = () => void;
export type UpdateHook = (dt: number) => void;
export type DrawHook = (graphics: Graphics) => void;
export type CloseHook = (time: number) => void;

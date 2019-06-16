import * as Roact from '@rbxts/roact';

const LocalPlayer: Player = game.GetService("Players").LocalPlayer as Player;
const PlayerGui = LocalPlayer.FindFirstChildOfClass("PlayerGui");

const ui = <screengui>

</screengui>;

Roact.mount(ui, PlayerGui, "UI");

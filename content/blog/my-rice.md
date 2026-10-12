---
title: My rice
author: sh0ds
date: 2026-10-12
summary: Arch, Hyprland and way too much Catppuccin Mocha.
---
I finally got my desktop to a point where I'm happy with it, so here's what it is.

It's plain Arch with Hyprland 0.56 and the new Lua config. Everything is Catppuccin Mocha, and I mean everything: the bar, the terminal, the lock screen, GTK and Qt apps, even the OSRS interface. Nothing flashes white anymore.

## The look

Only the focused window gets a blue-to-mauve border and a soft glow, the rest are dimmed a bit. If there's only one window on a workspace it fills the whole screen with no gaps. Windows pop in and settle on a spring, which sounds like a gimmick but it feels really nice at 180 Hz.

The bar is waybar with three little islands on frosted glass: workspace dots and the current song on the left, the clock in the middle, and one pill on the right for volume, network, notifications and my Raspberry Pi (green when it's up).

## Pop-ups

The stuff I only need for a few seconds slides down from the top and slides back up when I press the key again. A terminal, my notes, SoundCloud, my music player, WhatsApp in the terminal and btop on Ctrl+Shift+Escape, same as the task manager on Windows. Old habits.

## Terminal

kitty and tmux, bash with starship, and Neovim with LazyVim. Neovim sits on the same see-through background as the terminal, so it doesn't look like a solid block anymore. There are also some joke commands in my bashrc. Try typing claer.

## OSRS

Yes, I play Old School RuneScape on it. RuneLite runs through the Bolt launcher so Jagex accounts work on Linux, and I made a Mocha skin for the game's interface by recolouring the RuneLITE resource pack with a little Python script. The login screen is my wallpaper. Probably the most time I've spent on anything in this rice (duh).

## Getting it

Everything is on GitHub at github.com/sh0ds/dotfiles. Clone it and run the install script, it symlinks everything and backs up your old files first:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh
```

The README has the package list and the keybinds. It's set up for my machine (NVIDIA, two 1080p monitors), so change things to your liking.

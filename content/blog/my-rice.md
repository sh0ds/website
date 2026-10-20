---
title: My rice
author: sh0ds
date: 2026-10-20
summary: Arch, Hyprland and way too much Catppuccin Mocha.
---

My desktop is finally done, so here's what it is.

It's plain Arch with Hyprland and the new Lua config. Everything is Catppuccin Mocha: the bar, the terminal, the lock screen, GTK and Qt apps, even the OSRS interface. Nothing flashes white anymore.

# The look

Only the focused window gets a blue-to-mauve border and a soft glow, the rest are dimmed a bit. One window on a workspace fills the whole screen. The bar is waybar on frosted glass: workspaces and the current song on the left, the clock in the middle, and pills for volume, network and my Pi (green when it's up) on the right.

# Pop-ups

Everything I only need for a few seconds slides down from the top and back up when I press the key again: a terminal, my notes in Obsidian, SoundCloud, my music, my calendar, WhatsApp, mail and btop on Ctrl+Shift+Escape, same as the task manager on Windows. Old habits.

# Terminal

kitty and tmux, bash with starship, and Neovim with LazyVim on the same see-through background. Mail runs in the terminal too, with aerc. There are some joke commands in my bashrc. Try typing claer.

# Music

Bitwig Studio for making speedhouse, Mixo for my DJ library, Audacity for recording. Each has its own workspace and a key that jumps to it or starts it.

# OSRS

Yes, I play Old School RuneScape on it. RuneLite runs through Bolt so Jagex accounts work on Linux, and I recoloured its interface to Mocha with a little Python script. Probably the most time I've spent on anything in this rice (duh).

# Getting it

Everything is on GitHub at github.com/sh0ds/dotfiles. Clone it and run the install script, it symlinks everything and backs up your old files first:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh
```

It's set up for my machine (NVIDIA, two 1080p monitors), so change things to your liking.

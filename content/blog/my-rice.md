---
title: My rice
author: sh0ds
date: 2026-10-23
summary: Arch, Hyprland with a Lua config, Amethyst: black, plum greys, one violet.
---

First version was Catppuccin Mocha with glow, blur and spring animations. Looked like every other rice. Stripped it down to something that looks like the machine underneath and called it Amethyst.

# Base

```
os      Arch, plain
wm      Hyprland 0.56, Lua config
login   SDDM
font    Terminess Nerd Font
gpu     NVIDIA, two 1080p screens
config  hyprland.lua base, rice.lua look + rules + keys
```

If rice.lua breaks, the base still starts.

# Look

```
bg      #000000
line    #2b2238
dim     #5e5270
fg      #b0a6c4
bright  #ece4fb
accent  #b06cff
```

3 px gaps, square corners, 1 px borders. Only the focused window gets the violet frame. No shadows, blur or transparency. Motion is one expo-out curve: hard start, clean stop, no bounce or scaling. New windows fade in where they land while the others glide aside, workspaces shift with a short cross-fade, drop-downs shoot down from the top. Under 200 ms, 180 Hz. Same palette in kitty, tmux, Neovim, GTK, Qt and every TUI. Neovim runs its own scheme: code grey, keywords bright, strings and numbers violet.

# Bar

waybar, one line of text along the bottom, no icons:

```
left    1 2 3 4 5  Burial - Archangel
right   cpu 07% | mem 3.1G | 52°C | gpu 4% | pi up
        vol  64 | eth ↓1.2M ↑84K | 2026-10-23 09:45 | off
```

pi up turns violet when my Pi answers a ping. LIVE and REC show up in the middle while I share or record.

# Drop-downs

Things I need for a few seconds drop down from the top edge and go away on the same key: terminal, SoundCloud, rmpc, calendar, WhatsApp (nchat), mail (aerc), btop on Ctrl+Shift+Escape. One at a time.

# Terminal

kitty and tmux, bash with a one-line starship prompt, Neovim with LazyVim, yazi, lazygit. Some joke commands in my bashrc. Try typing claer.

# Music

mpd and rmpc for my own files. PipeWire plays each song at its own sample rate. Easy Effects corrects my headset to the Harman curve with a limiter after it. DJ software (Lexicon, rekordbox, Traktor) runs in a Windows VM, songs dropped in ~/Music/DJ show up there as Z:.

# Getting it

github.com/sh0ds/dotfiles. Clone and run the install script, it symlinks everything and backs up old files first:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh
```

Set up for my machine, so change what you need.

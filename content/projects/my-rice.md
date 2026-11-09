---
title: My rice
author: sh0ds
summary: Afterhours, my desktop: Arch, Hyprland and my own little Quickshell shell, made for making games.
---

Updated 2026-11-09.

I started with Catppuccin Mocha, then had a violet Amethyst phase and then Diag, the diagnostic look this site used to have. Now it's Afterhours, a desktop I actually make games on instead of one that just looks like a dashboard. Almost black with a bit of violet in it, violet for focus, amber when something wants my attention and coral for recording and errors. One font for everything, and games and art keep their own colours.

Since 2026-11-09 it's notched, so nothing is rounded anymore and the corners get cut at 45 degrees instead.

# Base

```
os      Arch, plain
wm      Hyprland 0.57, Lua config
shell   Quickshell, my own QML (afterhours)
login   SDDM with an Afterhours theme, Plymouth at boot
font    JetBrains Mono Nerd Font, everywhere
screens two, DP-4 is the main one at 180 Hz
gpu     NVIDIA
config  hyprland.lua base, rice.lua look + rules + keys
```

hyprland.lua is just the plain defaults without animations. rice.lua puts the look on top in a protected call, so if I break it the base still works.

# Look

```
bg       #0d0c10
panel    #131218
raised   #1b1a22
line     #35323f
muted    #948fa3
text     #e0dde8
accent   #b49cf0   violet
attn     #d99f66   amber
error    #d9786c   coral
```

Everything that floats is frosted glass with cut corners: the rail, the cards under it, the launcher, toasts and the password field on the lock screen. Buttons cut two opposite corners, and on the right side of the rail it's mirrored. Windows stay square with a 2 px violet gradient border, 6 px between them and 12 px at the screen edge so they line up with the rail. A single window keeps its gaps too.

Every window is a bit see-through over the blurred wallpaper, a bit more when it's not focused. Games, video, art tools and fullscreen stay solid, and unfocused windows get 8 % darker. The wallpaper is a violet haze with soft clouds, and it never moves.

Violet shows that something is on, as a fill or a thin underline but never as an outline: the active workspace, a toggle, the open clock. The border of the focused window tells me what's going on: violet is normal, amber means notifications are held back and coral means I'm recording or sharing my screen.

For motion, colour changes take 200 ms and everything that moves uses the same spring. Popups grow out of whatever you clicked and the workspace marker stretches like a drop.

# The rail

Waybar, SwayNC and wlogout are gone. Afterhours draws three glass pieces on every monitor instead:

```
left    apps · workspaces 1-0 · focused window title
centre  the island: clock, volume, notifications
right   now playing with cava bars · keep awake · the Pi
        network · sound · inbox · tray · session
```

The island is the clock. When I change the volume it stretches into a volume bar, when a notification comes in it turns into that, and then it shrinks back to the time. Clicking the clock opens Today with the month, cpu, gpu and memory graphs, the disks, my Pi with its ping and what's playing.

Notifications run on the shell's own D-Bus server, with plain text, actions, a quiet mode and an inbox on SUPER+N. A line at the bottom of each toast runs out so you see how long it stays, and while I share my screen they're held back. The sound and network icons open the control centre: outputs, the mic, volume per app, Wi-Fi and toggles for night light, quiet, keep awake and game mode. The session menu asks twice before logging out, rebooting or shutting down.

Game mode turns on by itself when a game goes fullscreen. The rail hides on that monitor and animations, dimming and shadows turn off.

# Making games

SUPER+Space opens the launcher. Just type to find an app, = for maths, > for commands, / for open windows and : for emoji. Every game tool has a little wrapper that starts it or jumps to it if it's already open:

```
pico8, picotron   from ~/.local/opt, carts in ~/code/pico8
aseprite          pixel art (Steam), batch export for builds
sfx               jsfxr or ChipTone for sound effects
bitwig            music, at 128 frames for live MIDI
gba               Game Boy games in mGBA
```

I write PICO-8 and Picotron code in Zed, with their APIs in the Lua language server, F5 to rerun the cart and F7 to count tokens. ALT+Print takes a screenshot of a region with a frame for devlogs, a caption, the date and sh0ds.dev in the corner. SUPER+SHIFT+R records a region.

# Terminal and editors

kitty, see-through with solid text and a 3 px violet beam cursor with a short trail. The Starship prompt looks like the rail: a square bracket around two lines, the Arch logo, the path with the repo folder bright, the branch in violet, changes in amber and a dotted line to the clock. The arrow turns coral when a command fails. No tmux.

Zed is my editor and $EDITOR, with a matching theme and AI features and telemetry turned off. eza, btop, bat, lazygit, GTK, Qt, Firefox, Vesktop and Obsidian all use the same colours and square corners. Icons are Papirus-Dark with violet folders, and the cursor is Posy's black one.

# Music

mpd and rmpc play my music from ~/Music, my DJ library in ~/Music/DJ included. The rail, the media keys and the lock screen all pick up what's playing. PipeWire follows the sample rate of the track, and Easy Effects tunes my Corsair Virtuoso XT towards the Harman curve with a limiter after it.

Lexicon, rekordbox, Traktor and Audacity run in a Windows VM. My songs from ~/Music/DJ show up there as Z:. djvm starts it or shows it on workspace 7, and djvm off shuts it down cleanly.

# Getting it

Everything is in github.com/sh0ds/dotfiles: the configs, screenshots, what you need to install and some setup guides. Clone it, try the preview install first and then install it for real:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh --target /tmp/afterhours-preview
bash ~/code/dotfiles/install-dotfiles.sh
```

The installer backs up every file it replaces to ~/.dotfiles-backup first. Most configs are linked to the repo, only Qt, btop, nchat and Zed get copies they can write to.

Keep in mind it's set up for my machine. Check the monitor (DP-4), the German keyboard layout and the NVIDIA settings in hyprland.lua, and read the audio and DJ VM guides before you use those parts. You need Quickshell 0.3.2 or newer and Hyprland 0.56 or newer.

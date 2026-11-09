---
title: My rice
author: sh0ds
summary: Afterhours: Arch, Hyprland and my own Quickshell shell, notched glass, built for making games.
---

Updated 2026-11-09.

This started with Catppuccin Mocha, went through a violet Amethyst phase and then Diag, the diagnostic look this site had. Now it's Afterhours: a desktop for making games instead of a dashboard. Near-black charcoal with a violet cast, violet for focus, amber for attention, coral for recording and errors. One font everywhere. Games and artwork keep their own colours.

Since 2026-11-09 it's notched: nothing is rounded anymore, the shell cuts its corners at 45 degrees instead.

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

hyprland.lua is plain defaults with no animations. rice.lua layers the look on top through a protected call, so if it breaks the base still works.

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

Everything that floats is frosted glass with its corners cut at 45 degrees: the rail, the cards under it, the launcher, toasts and the lock screen's password field. Buttons cut two opposite corners, mirrored on the right side of the rail. Windows are square with a 2 px violet gradient border, 6 px between tiles and 12 px at the screen edge, lined up with the rail. A lone window keeps its gaps.

Every window is see-through over the blurred wallpaper, a little more when it isn't focused. Games, video, art tools and fullscreen stay solid, and unfocused windows dim by 8 %. The wallpaper is a violet haze with soft clouds and never moves.

Violet shows a state as a fill or a thin underline, never as an outline: the active workspace, a toggle that's on, the open clock. The focused window's border says what the desktop is doing: violet is normal, amber means notifications are held back, coral means I'm recording or sharing the screen.

Motion: colour changes take 200 ms, and everything that moves shares one spring. Popups grow out of what you clicked and the workspace marker stretches like a drop.

# The rail

Waybar, SwayNC and wlogout are gone. Afterhours draws three glass pieces on every monitor:

```
left    apps · workspaces 1-0 · focused window title
centre  the island: clock, volume, notifications
right   now playing with cava bars · keep awake · the Pi
        network · sound · inbox · tray · session
```

The island is the clock. It stretches into the volume bar when the volume changes and into a notification when one lands, then shrinks back to the time. Click the clock for Today: the month, cpu, gpu and memory graphs, the disks, the Pi with its ping and what's playing.

Notifications are the shell's own D-Bus server: plain text, actions, a quiet mode and an inbox on SUPER+N. Toasts show how long they stay with a line that runs out along the bottom. Screen sharing holds them back. Sound and the network icon open the control centre with outputs, the mic, a volume per app, Wi-Fi and toggles for night light, quiet, keep awake and game mode. The session menu asks twice before logging out, rebooting or powering off.

Game mode turns on by itself when a game goes fullscreen: the rail hides on that monitor and animations, dimming and shadows go off.

# Making games

SUPER+Space opens the launcher: type to find an app, = for maths, > for commands, / for open windows and : for emoji. The game tools each have a small wrapper that starts them or jumps to them:

```
pico8, picotron   from ~/.local/opt, carts in ~/code/pico8
aseprite          pixel art (Steam), batch export for builds
sfx               jsfxr or ChipTone for sound effects
bitwig            music, at 128 frames for live MIDI
gba               Game Boy games in mGBA
```

PICO-8 and Picotron code lives in Zed, with their APIs in the Lua language server, F5 to rerun the cart and F7 to count tokens. ALT+Print takes a region screenshot framed for devlogs, with a caption, the date and sh0ds.dev in the corner. SUPER+SHIFT+R records a region.

# Terminal and editors

kitty with a 3 px violet beam cursor with a short trail, see-through with solid text, and Starship drawn like the rail: a square bracket holding two lines, the Arch mark, the path with the repo's folder bright, branch in violet, changes in amber, a dotted rule to the clock. The arrow turns coral after a failed command. No tmux.

Zed is the editor and $EDITOR, with the theme to match and AI features and telemetry off. eza, btop, bat, lazygit, GTK, Qt, Firefox, Vesktop and Obsidian all follow the palette and the square corners. Icons are Papirus-Dark with violet folders, and the cursor is Posy's black one.

# Music

mpd and rmpc play my files from ~/Music, including the DJ library under ~/Music/DJ. The rail, media keys and lock screen pick up playback through the media controls. PipeWire follows the track's sample rate, and Easy Effects corrects my Corsair Virtuoso XT towards the Harman curve with a limiter after it.

Lexicon, rekordbox, Traktor and Audacity live in a Windows VM. Songs in ~/Music/DJ appear there as Z:. djvm starts or shows it on workspace 7, djvm off asks it to shut down cleanly.

# Getting it

github.com/sh0ds/dotfiles has the configs, screenshots, the dependency list and setup guides. Clone it, look at the preview install first, then install:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh --target /tmp/afterhours-preview
bash ~/code/dotfiles/install-dotfiles.sh
```

The installer backs up replaced files under ~/.dotfiles-backup first. Most configs are linked into the checkout; Qt, btop, nchat and Zed get writable copies.

This is set up for my machine. Check the monitor (DP-4), the German keyboard layout and the NVIDIA settings in hyprland.lua, and follow the audio and DJ VM guides before using those parts. You need Quickshell 0.3.2 or newer and Hyprland 0.56 or newer.

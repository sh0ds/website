---
title: My rice
author: sh0ds
date: 2026-11-03
summary: Afterhours: Arch, Hyprland and my own Quickshell shell, built for making games.
---

Updated 2026-11-03.

This started with Catppuccin Mocha, went through a violet Amethyst phase and then Diag, the diagnostic look this site had. Today it became Afterhours: a desktop for making games instead of a dashboard. Near-black charcoal with a violet cast, violet for focus, amber for attention, coral for recording and errors. One font everywhere. Games and artwork keep their own colours.

# Base

```
os      Arch, plain
wm      Hyprland 0.56, Lua config
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

Windows get 10 px squircle corners, a 2 px violet gradient border and a soft shadow, with 4 px between tiles and 12 px at the screen edge. A window alone on its workspace goes edge to edge. Unfocused windows dim by 8 % with a short fade, except games, video and picture-in-picture. Shell controls use 8 px radii, panels 14 px. Surfaces are opaque: no blur, no glow, no colour cycling.

The focused window's border also says what the desktop is doing: violet is normal, amber means notifications are held back, coral means I'm recording or sharing the screen.

Motion: colour changes take 200 ms, things that move take a 320 ms ease-out, and Hyprland's window and workspace springs are tuned to the same pace.

# The rail

Waybar, SwayNC and wlogout are gone. Afterhours draws a floating rounded rail on every monitor:

```
left    apps button · workspaces 1-0 · focused window title
centre  clock, click for the month
right   rec/share · now playing with cava bars · sys stats
        the Pi · network · keep awake · sound · tray
        inbox · session
```

Notifications are its own D-Bus server: plain text, actions, a quiet mode and a small inbox on SUPER+N. Toasts slide out when they're done, and screen sharing holds them back. The network cell opens a Wi-Fi picker, right-click for settings; keep awake stops the screen from locking during a long render or a playtest. The session menu asks before logging out, rebooting or powering off, and suspend waits until hyprlock really locked.

# Making games

SUPER+Space searches every app. The game tools each have a small wrapper that starts them or jumps to them:

```
pico8, picotron   from ~/.local/opt, carts in ~/code/pico8
aseprite          pixel art (Steam), batch export for builds
sfx               jsfxr or ChipTone for sound effects
bitwig            music, at 128 frames for live MIDI
```
 ALT+Print takes a region screenshot framed for devlogs, with a caption, the date and sh0ds.dev in the corner. SUPER+SHIFT+R records a region.

# Terminal and editors

kitty with a 3 px violet beam cursor that keeps its shape when unfocused, and Starship drawn like the rail: a bracket holding two lines, the Arch mark, the path with the repo's folder bright, branch in violet, changes in amber, a dotted rule to the clock. The arrow turns coral after a failed command. No tmux anymore.

Zed is the editor for projects, with the theme to match and AI features and telemetry off. Helix is $EDITOR. eza, btop, bat, GTK, Qt, Firefox and Obsidian all follow the palette. Thunar has the rail's look, icons are Papirus-Dark with violet folders, and the cursor is Posy's black one.

# Music

mpd and rmpc play my files from ~/Music, including the DJ library under ~/Music/DJ. The rail, media keys and lock screen pick up playback through the media controls. PipeWire is configured to follow the track's sample rate, and Easy Effects corrects my Corsair Virtuoso XT towards the Harman curve with a limiter after it.

Lexicon, rekordbox, Traktor and Audacity live in the Windows DJ VM. Songs in ~/Music/DJ appear there as Z:. djvm starts or shows it on workspace 7; djvm off requests a clean shutdown.

Installer ISOs now belong in ~/.local/share/djvm/isos, outside Downloads. djvm setup copies existing media there, downloads missing VirtIO drivers and repairs the VM's CD-ROM paths after backing up its definition. It leaves the Windows disk and shared music alone. Once Windows is installed, djvm eject can remove the installer CD attachments while keeping the ISO files. If Windows does not shut down within 90 seconds, the helper reports the problem and the session menu cancels the host power action instead of forcing the VM off.

# Getting it

github.com/sh0ds/dotfiles has the configs, screenshots, the dependency list and setup guides. Clone it, look at the preview install first, then install:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh --target /tmp/afterhours-preview
bash ~/code/dotfiles/install-dotfiles.sh
```

The installer backs up replaced files under ~/.dotfiles-backup first. Most configs are linked into the checkout; Qt, btop, nchat and Zed get writable copies.

This is set up for my machine. Check the monitor (DP-4), the German keyboard layout and the NVIDIA settings in hyprland.lua, and follow the audio and DJ VM guides before using those parts. You need Quickshell 0.3.2 or newer and Hyprland 0.56.

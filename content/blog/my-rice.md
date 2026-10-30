---
title: My rice
author: sh0ds
date: 2026-10-23
summary: Arch + Hyprland in Diag: black, cool greys, Arch blue and Terminess.
---

Updated 2026-10-26.

This started with Catppuccin Mocha, then went through a violet Amethyst version. The current setup is Diag: the diagnostic layout of this site in Arch Linux blue. Black surfaces, precise labels and colour where it tells me something. The site keeps its Raspberry Pi pink and green; the desktop uses the same visual language with a different accent. Both now use Terminess.

# Base

```
os      Arch, plain
wm      Hyprland 0.56, Lua config
login   SDDM
font    Terminess Nerd Font Mono, 13.5 pt in kitty
screens two 1080p displays
gpu     NVIDIA
config  hyprland.lua base, rice.lua look + rules + keys
```

hyprland.lua loads rice.lua through a protected call. If the rice module fails to load, the base configuration stays usable.

# Look

```
bg      #000000
rule    #3f4650
mid     #8a929c
fg      #c4c9ce
ink     #e6e8ea
accent  #1793d1
warn    #ffb000
error   #e5484d
```

A 4 px spacing unit: 8 px between neighbouring tiles and at the screen edge, square corners, 2 px window frames and 1 px separators inside apps. The focused window gets the blue frame. Tabs use a blue label or underline on a quiet row. Surfaces are opaque, without shadows, blur or glow.

Windows use a critically damped spring, configured to settle without bouncing. Entry scales from 98%, exit to 99%, and workspace travel is 4%. Entry and focus fades take 120 ms; layer and exit fades take 80 ms. Menus fade at their normal text size, and the bar stays still. These are the configured values, not measured frame timings.

kitty, tmux, Neovim, GTK, Qt and the terminal tools share the palette. Firefox, Obsidian and Vesktop follow it where their theme support allows. App controls share the styling; websites, documents, artwork and video keep their content colours. The wallpaper is black with a faint dot grid and a dim pixel Arch mark.

# Bar

Waybar is a slim rail across the top:

```
left    1 2 3 4 5 | LIVE / REC when active | play artist / title
centre  18:25
right   sys | pi: up | vol 64% | msg 0 | tray | [exit]
```

The active workspace has a blue underline. Music titles have a fixed length so they cannot push the clock around. Click sys to expand CPU, memory and temperature; GPU and network detail stay in its tooltip. Right-click opens btop.

The Pi label has its own identity: red pi, green colon, neutral up or red down. Clicking it opens an SSH session. The clock shows the date and a native calendar on hover; clicking switches between month and year. The Proton Calendar helper and keybinding are removed.

# Session and notifications

[exit] opens a text-only wlogout console: five numbered rows for lock, end session, suspend, reboot and power off, each with a visible hotkey. No logos or power icons. The helper adjusts its layout for screen size, scale and rotation.

SwayNC uses the same flat surfaces and borders. Its music widget shows small real artwork when available, the track details and square playback controls. No blurred cover behind the title or oversized application logo. Quick settings and the volume slider sit in the same panel. SUPER+N opens it.

# Quick apps

Things I need for a few seconds are normal tiled windows with one key each:

```
SUPER+S             SoundCloud PWA
SUPER+U             rmpc
SUPER+I             WhatsApp in nchat
SUPER+SHIFT+I       mail in aerc
CTRL+SHIFT+Escape   btop
```

The key starts the app beside what I'm doing. Press it again to hide it; the next press brings it back tiled on the current workspace. Mail starts hidden at login so notifications work from the start. Obsidian is on SUPER+O, and the DJ VM is on SUPER+SHIFT+M.

# Terminal

kitty and tmux, bash with a two-line Starship prompt, Neovim with LazyVim, yazi and lazygit. The prompt puts directory, Git state, language, elapsed time and clock above a blue input marker. A few Nerd Font icons act as landmarks; a failed command turns the marker red.

eza handles ls, ll and lt with its own Diag theme: blue directories, grey files and metadata, green executables and red broken links. Its colour mappings override inherited palettes, so listings no longer fall back to Mocha. New terminals greet me with fastfetch. Some joke commands remain in bashrc; try claer.

SUPER+A opens site-dev: tmux windows for the editor, builds, a REPL and the Pi. It starts the detached session at the calling terminal's size, so the Pi's fastfetch greeting does not first render into an 80-column window and break when I attach. The remote Pi shell keeps its own pink and green configuration.

# Music

mpd and rmpc play my files from ~/Music, including the DJ library under ~/Music/DJ. The bar, media keys, lock screen and notification panel pick up playback through the media controls. PipeWire is configured to follow the track's sample rate, and Easy Effects corrects my Corsair Virtuoso XT towards the Harman curve with a limiter after it.

Lexicon, rekordbox, Traktor and Audacity live in the Windows DJ VM. Songs in ~/Music/DJ appear there as Z:. djvm starts or shows it on workspace 7; djvm off requests a clean shutdown.

Installer ISOs now belong in ~/.local/share/djvm/isos, outside Downloads. djvm setup copies existing media there, downloads missing VirtIO drivers and repairs the VM's CD-ROM paths after backing up its definition. It leaves the Windows disk and shared music alone. Once Windows is installed, djvm eject can remove the installer CD attachments while keeping the ISO files. If Windows does not shut down within 90 seconds, the helper reports the problem and the power menu cancels the host power action instead of forcing the VM off.

# Getting it

github.com/sh0ds/dotfiles has the configs, current screenshots, dependency list and setup guides. Clone it and run the installer:

```
git clone https://github.com/sh0ds/dotfiles.git ~/code/dotfiles
bash ~/code/dotfiles/install-dotfiles.sh
```

The installer backs up replaced files under ~/.dotfiles-backup first. Most configs are linked; Qt's palette path is generated for the local home directory, while btop and nchat get writable copies. Close those two apps before installing.

This is set up for my machine. Check the monitor, keyboard, NVIDIA and Pi settings, and follow the audio and DJ VM guides before using those parts.

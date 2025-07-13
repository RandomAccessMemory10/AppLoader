# [AppLoader](https://github.com/RandomAccessMemory10/AppLoader/releases/download/v1.0/AppLoader.dmg) (Click to download)
This is a very basic alternative app store which uses homebrew to quickly install and manage apps that aren't available on the default mac app store. It uses a very simplified UI, and I've tried to make the experience as user friendly as possible. With the power that comes with homebrew, this app allows you to install and uninstall apps with a single click of a button. No more hunting the web for DMG's and installer packages, just search for the app you want out of the existing curated library. I plan to modify this app to include all available homebrew casks in the future.
A few things to note before use:
- This is the first app I've made, it's in its testing phase and it's unstable. I'm completely new to both coding and development.
- This app is not signed, since I'm unemployed and can't afford Apple's development program. You cannot open this app without running the following command in terminal after dragging it into your Applications folder:
xattr -d com.apple.quarantine /Applications/AppLoader.app
- This app requires homebrew to be installed in order to function. I have implemented a homebrew checking system which detects whether it's been installed on your system. Hopefully, if you don't have homebrew installed, the app should guide you through the very straightforward process of acquiring it. If this fails, simply paste the following command into your terminal to install homebrew:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

## Feature list
- An ever expanding curated app library which has been sorted into categories, and a search bar to quickly find what you're looking for
- A homepage button in the top corner of each appcard to find out more about each app
- Extremely quick and easy installation and app mangement. Apps are installed and uninstalled with the click of one button
- You can also directly open apps that are currently installed

## Pros and cons
Pros
- Vast curated app library
- Extremely fast and convienient installation and app management
- Friendly user interface
- Categorised apps
- Fast searching
- Shows details such as app size and developer name
- Beautiful icons pulled from macosicons.com

Cons
- Limited apps (added manually)
- Requires homebrew
- macOS exclusive
- May be some bugs due to this being and indepentantly built, newly released app

## See it in action
Quick installation

![part 2](https://github.com/user-attachments/assets/147b6eba-8c3e-4a51-9e70-f774c46fb4bf)

---

Quick deletion

![part 3](https://github.com/user-attachments/assets/56074dcb-2da3-4d99-82f6-50a4c348935a)

---

Installed and update views

![part 4](https://github.com/user-attachments/assets/b99098e5-c7f2-4555-bc70-276b65c963e7)

----

# [BrewSearcher](https://github.com/RandomAccessMemory10/AppLoader/releases/download/v1.0.0/BrewSearcher.dmg) (Click to download)
This is the alternative version to AppLoader which carries new strengths but comes with some weaknesses. Instead of a conventional window, it's formatted as a single searchbar much like the macOS spotlight search. Instead of a limited curated app library, it searches the homebrew cask library live so all possible casks are available to download. You can still manage the apps by updating, uninstalling and opening from the same place.

## Pros and cons
Pros
- Unlimited homebrew cask library. Contains every app that's available to install via homebrew.
- Search is up-to-date with the current homebrew cask library.
- Minimalist UI with a single searchbar in the style of macOS spotlight search, and can quickly be brought up by pressing ctrl + space at any point.
- Extremely fast and convienient installation and app management

Cons
- Slower search since results and icons are loaded in real time
- Icons may be blurry or incorrect since they're loaded from different API's
- No app categorisation

## See it in action
Search entire homebrew cask library

![part 1 s](https://github.com/user-attachments/assets/21a93aab-357b-439f-b4ff-3ddb0362fe39)

---

Quick installation

![part 2 s](https://github.com/user-attachments/assets/45bbbdb5-f110-4299-8c8f-2976a535d8ed)

---

Installed and updates views

![stage 3 s](https://github.com/user-attachments/assets/07af6a0b-967a-47e0-946f-91dd26501493)


---

Quick app management

![stage 4 s](https://github.com/user-attachments/assets/65884857-f969-40b5-b477-8935ba5a5155)

---

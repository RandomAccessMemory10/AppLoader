# AppLoader
This is a very basic alternative app store which uses homebrew to quickly install and manage apps that aren't available on the default mac app store. It uses a very simplified UI, and I've tried to make the experience as user friendly as possible. With the power that comes with homebrew, this app allows you to install and uninstall apps with a single click of a button. No more hunting the web for DMG's and installer packages, just search for the app you want out of the existing curated library. I plan to modify this app to include all available homebrew casks in the future.
A few things to note before use:
- This is the first app I've made, it's in its testing phase and it's unstable. I'm completely new to both coding and development, and, as ashamed as I may be to admit it, AI helped me a lot with this.
- This app is not signed, since I'm unemployed and can't afford Apple's development program. You cannot open this app without running the following command in terminal after dragging it into your Applications folder:
xattr -d com.apple.quarantine /Applications/AppLoader.app
- This app requires homebrew to be installed in order to function. I have implemented a homebrew checking system which detects whether it's been installed on your system. Hopefully, if you don't have homebrew installed, the app should guide you through the very straightforward process of acquiring it. If this fails, simply paste the following command into your terminal to install homebrew:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Feature list
- An ever expanding curated app library which has been sorted into categories, and a search bar to quickly find what you're looking for
- A homepage button in the top corner of each appcard to find out more about each app
- Extremely quick and easy installation and app mangement. Apps are installed and uninstalled with the click of one button
- You can also directly open apps that are currently installed


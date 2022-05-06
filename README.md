# Display Current AWS Amplify Environment

This extension displays the AWS Amplify environment. It makes it easy for you to see which environment you are currently working in.

## Setup

When you use the ```amplify checkout env``` command, Amplify updates the ```/amplify/.config/local-env-info.json``` file.

The extension looks for changes in this file and displays the env name from this file. This file is located in .gitignore, which prevents the File System Watcher from finding the file and displaying the env name. You must have **Search: Use Ignore Files** disabled to enable this extension to work.

![ignoreFiles](./img/search-use-ignore-files.png)

## Use

This extension displays the current Amplify Env name in the status bar of VS code. When you change the Amplify environment, this extension also notifies you with an informational message.

![statusBar](./img/statusbar.png) ![message](./img/message.png)


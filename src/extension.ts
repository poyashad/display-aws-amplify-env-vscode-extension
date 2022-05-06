"use strict";

import * as vscode from "vscode";
import { posix } from "path";
let myStatusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage("No folder or workspace opened");
  } else {
    const folderUri = vscode.workspace.workspaceFolders[0].uri;
    const fileUri = folderUri.with({
      path: posix.join(
        folderUri.path,
        "/amplify/.config",
        "/local-env-info.json"
      ),
    });

    // init Status bar
    const myCommandId = "sample.showSelectionCount";
    myStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    myStatusBarItem.command = myCommandId;
    context.subscriptions.push(myStatusBarItem);
    updateStatusBarItem(await getLocalEnv());

    //Subscribes
    context.subscriptions.push(
      // När man klickar
      vscode.commands.registerCommand(myCommandId, async () => {
        if (!vscode.workspace.workspaceFolders) {
          vscode.window.showInformationMessage("No folder or workspace opened");
        } else {
          vscode.window.showInformationMessage(
            `Your are working in Amplify Environment: ${await getLocalEnv()}`
          );
        }
      }),
    );

    context.subscriptions.push(
      vscode.workspace.createFileSystemWatcher('**/local-env-info.json').onDidChange(async e => {
        console.log(e);
        if(e.path === fileUri.path){
          vscode.window.showInformationMessage(
            `Your are working in Amplify Environment: ${await getLocalEnv()}`
          );
          
          updateStatusBarItem(await getLocalEnv());
        }
      })
    );
  }
}
async function getLocalEnv(): Promise<String>{
     if (!vscode.workspace.workspaceFolders) {
      vscode.window.showInformationMessage("No folder or workspace opened");
      return '';
    } else {
     const folderUri = vscode.workspace.workspaceFolders[0].uri;
     const fileUri = folderUri.with({
       path: posix.join(
         folderUri.path,
         "/amplify/.config",
         "/local-env-info.json"
       ),
     });
     const readData = await vscode.workspace.fs.readFile(fileUri);
     const readStr = Buffer.from(readData).toString("utf8");
     const json = JSON.parse(readStr);
     const env = json.envName;
     return env;
    }
}

async function updateStatusBarItem(env: String): Promise<void> {
    myStatusBarItem.text = `$(split-vertical) Amplify Environment: ${env}`;
    myStatusBarItem.show();
  }

// this method is called when your extension is deactivated
export function deactivate() {}

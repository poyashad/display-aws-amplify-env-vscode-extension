"use strict";

import * as vscode from "vscode";
import { posix } from "path";
let myStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const myCommandId = "sample.showSelectionCount";
  context.subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
      if (!vscode.workspace.workspaceFolders) {
		vscode.window.showInformationMessage(
			"No folder or workspace opened"
		  );
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
		vscode.window.showInformationMessage(
		  `Your are working in Amplify Env: ${env}`
		);
	  }
      
    })
  );
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  myStatusBarItem.command = myCommandId;
  context.subscriptions.push(myStatusBarItem);

  updateStatusBarItem();
}

async function updateStatusBarItem(): Promise<void> {
  if (!vscode.workspace.workspaceFolders) {
    myStatusBarItem.hide();
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
    myStatusBarItem.text = `$(split-vertical) Amplify Env: ${json.envName}`;
    myStatusBarItem.show();
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

"use strict";

import { posix } from "path";
import * as vscode from "vscode";

let myStatusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage("No folder or workspace opened");
  } else {
    const folderUri = vscode.workspace.workspaceFolders[0].uri;
    const localEnvFileUri = folderUri.with({
      path: posix.join(
        folderUri.path,
        "/amplify/.config",
        "/local-env-info.json"
      ),
    });
    const teamProviderFile = folderUri.with({
      path: posix.join(folderUri.path, "/amplify/team-provider-info.json"),
    });

    // init Status bar
    const myCommandId = "sample.showSelectionCount";
    myStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    myStatusBarItem.command = myCommandId;
    context.subscriptions.push(myStatusBarItem);
    updateStatusBarItem(await getLocalEnv(localEnvFileUri));

    //Subscribe on statusbar Click
    context.subscriptions.push(
      vscode.commands.registerCommand(myCommandId, async () => {
        const teamProviderEnvironments = await getTeamProviderEnvironments(
          teamProviderFile
        );
        const currentEnvironment = await getLocalEnv(localEnvFileUri);
        const options: {
          label: string;
          description?: string;
          picked?: boolean;
          kind?: number;
        }[] = [];
        options.push({
          label: `Amplify Environments (${teamProviderEnvironments.length})`,
          kind: vscode.QuickPickItemKind.Separator,
        });
        teamProviderEnvironments.forEach((env) => {
          if (env === currentEnvironment) {
            options.push({
              label: env,
              description: "Current Environment",
              picked: true,
            });
          } else {
            options.push({
              label: env,
            });
          }
        });
        options.push({
          label: `$(gist-new) Add Amplify Environment`,
        });
        options.push({
          label: `Amplify Sync`,
          kind: vscode.QuickPickItemKind.Separator,
        });
        options.push({
          label:  `$(refresh) Amplify Status`,
        });
        options.push({
          label: `$(arrow-down) Amplify Pull`,
        });
        options.push({
          label:  `$(arrow-up) Amplify Push`,
        });
        
      

        const quickPick = vscode.window.createQuickPick();
        quickPick.title = "Amplify Environments";
        quickPick.placeholder =
          "Change environment or add a new environment";
        quickPick.items = options;
        quickPick.onDidChangeSelection((selection) => {
          const envListIndex = options.findIndex(
            (option) => option.label === selection[0].label
          );
          console.log(envListIndex, options.length);
          if (envListIndex === options.length - 5) {
            createNewAmplifyEnv(options);
          }  else if (envListIndex === options.length - 3) {
            amplifyStatus();
          }else if (envListIndex === options.length - 2) {
            amplifyPull();
          } else if (envListIndex === options.length - 1) {
            amplifyPush();
          } else if (selection[0].picked === undefined && selection[0].kind === undefined) {
            amplifyEnvCheckout(selection[0].label);
          }
          quickPick.dispose();
        });
        quickPick.show();
      })
    );

    // Look for changes in the ENV file
    context.subscriptions.push(
      vscode.workspace
        .createFileSystemWatcher("**/local-env-info.json")
        .onDidChange(async (file) => {
          if (file.path === localEnvFileUri.path) {
            vscode.window.showInformationMessage(
              `Your are working in Amplify Environment: ${await getLocalEnv(
                localEnvFileUri
              )}`
            );
            updateStatusBarItem(await getLocalEnv(localEnvFileUri));
          }
        })
    );

  }
}

async function getLocalEnv(localEnvFileUri: any): Promise<string> {
  const readData = await vscode.workspace.fs.readFile(localEnvFileUri);
  const readStr = Buffer.from(readData).toString("utf8");
  const json = JSON.parse(readStr);
  const env = json.envName;
  return env;
}

async function getTeamProviderEnvironments(
  teamProviderFile: any
): Promise<Array<string>> {
  const readData = await vscode.workspace.fs.readFile(teamProviderFile);
  const readStr = Buffer.from(readData).toString("utf8");
  const teamProviderInfoJSON = JSON.parse(readStr);
  return Object.keys(teamProviderInfoJSON);
}

async function updateStatusBarItem(env: String): Promise<void> {
  myStatusBarItem.text = `$(split-vertical) Amplify Environment: ${env}`;
  myStatusBarItem.show();
}

function amplifyEnvCheckout(env: string) {
  const terminal = vscode.window.createTerminal('Amplify Extension Terminal');
     terminal.sendText(`amplify env checkout ${env}`);
     terminal.show();
}

async function createNewAmplifyEnv(options: any) {
  /*
Add env from Amplify Extension
  const newEnv = await vscode.window.showInputBox({
    placeHolder: "Name your new Amplify Environment",
  });
 if(options.find((option: { label: string | undefined; }) => option.label === newEnv)){
   console.log(newEnv, " Already Exists");
 } else {
   console.log("Create New Env ", newEnv);
   const terminal = vscode.window.createTerminal();
   terminal.show();
   terminal.sendText(`amplify env add`);
 }
 */
 const terminal = vscode.window.createTerminal('Amplify Extension Terminal');
  terminal.show();
  terminal.sendText(`amplify env add`);
  // Amplify Create new Env
}
function amplifyPull(){
  const terminal = vscode.window.createTerminal('Amplify Extension Terminal');
  terminal.show();
  terminal.sendText(`amplify pull`);
}

function amplifyPush(){
  const terminal = vscode.window.createTerminal('Amplify Extension Terminal');
  terminal.show();
  terminal.sendText(`amplify push`);
}
function amplifyStatus(){
  const terminal = vscode.window.createTerminal('Amplify Extension Terminal');
  terminal.show();
  terminal.sendText(`amplify status`);
}

// this method is called when your extension is deactivated
export function deactivate() {}

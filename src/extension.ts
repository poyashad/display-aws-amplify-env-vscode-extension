"use strict";

import { posix } from "path";
import * as vscode from "vscode";
import * as cp from "child_process";

let myStatusBarItem: vscode.StatusBarItem;
let checkoutEnvUsingStatusBar = false;

export async function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage("No folder or workspace opened");
  } else {
    vscode.workspace.findFiles("**/team-provider-info.json").then((result) => {
      if (result.length > 0) {
        console.log("Found Amplify Project");
        initExtension(context);
        vscode.workspace
        .createFileSystemWatcher("**/team-provider-info.json")
        .onDidDelete(async (file) => {
          console.log("Amplify Project Deleted");
          deactivateExtension();
        });
       
      } else {
        console.log("Looking for Amplify Project");
        context.subscriptions.push(
          vscode.workspace
            .createFileSystemWatcher("**/team-provider-info.json")
            .onDidCreate(async (file) => {
              console.log("Found Team Provider File - Activating Extension");
              activate(context);
            })
        );
      }
    });
  }
}
async function deactivateExtension() {
  console.log("Deactivating Extension");
  myStatusBarItem.hide();
  vscode.window.showInformationMessage("Amplify Project Deleted");
}

async function initExtension(context: vscode.ExtensionContext) {
  // Get local file paths for Amplify Project Files
  if (vscode.workspace.workspaceFolders) {
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
    // myStatusBarItem.tooltip = "Testing Hover";
    context.subscriptions.push(myStatusBarItem);
    updateStatusBarItem(await getLocalEnv(localEnvFileUri));

    //Show Quick Pick When clicking on status
    context.subscriptions.push(
      vscode.commands.registerCommand(myCommandId, async () => {
        showQuickPick(teamProviderFile, localEnvFileUri, folderUri);
      })
    );

    // Look for changes in the ENV file if the user uses "amplify checkout env"
    context.subscriptions.push(
      vscode.workspace
        .createFileSystemWatcher("**/local-env-info.json")
        .onDidChange(async (file) => {
          if (file.path === localEnvFileUri.path) {
            if (!checkoutEnvUsingStatusBar) {
              vscode.window.showInformationMessage(
                `Your are working in Amplify Environment: ${await getLocalEnv(
                  localEnvFileUri
                )}`
              );
              updateStatusBarItem(await getLocalEnv(localEnvFileUri));
            }
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
async function showQuickPick(
  teamProviderFile: any,
  localEnvFileUri: any,
  folderUri: any
) {
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
  // List Environments as options and "highlight" the current environment
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
  // List Amplify CLI Commands as Options
  options.push({
    label: `Amplify Sync`,
    kind: vscode.QuickPickItemKind.Separator,
  });
  options.push({
    label: `$(refresh) Amplify Status`,
  });
  options.push({
    label: `$(arrow-down) Amplify Pull`,
  });
  options.push({
    label: `$(arrow-up) Amplify Push`,
  });

  // Click Events on quick pick options
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = "AWS Amplify Environment";
  quickPick.placeholder = "Change environment or add a new environment";
  quickPick.items = options;
  quickPick.onDidChangeSelection(async (selection) => {
    const envListIndex = options.findIndex(
      (option) => option.label === selection[0].label
    );
    if (envListIndex === options.length - 5) {
      createNewAmplifyEnv(options);
    } else if (envListIndex === options.length - 3) {
      amplifyStatus();
    } else if (envListIndex === options.length - 2) {
      amplifyPull();
    } else if (envListIndex === options.length - 1) {
      amplifyPush();
    } else if (
      selection[0].picked === undefined &&
      selection[0].kind === undefined
    ) {
      amplifyEnvCheckout(selection[0].label, localEnvFileUri, folderUri.path);
    }
    quickPick.dispose();
  });
  quickPick.show();
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
  myStatusBarItem.text = `$(aws-amplify) Amplify Environment: ${env}`;
  myStatusBarItem.show();
}

async function amplifyEnvCheckout(
  env: string,
  localEnvFileUri: vscode.Uri,
  folderUriPath: string
) {
  checkoutEnvUsingStatusBar = true;
  const startDateTime = new Date(Date.now()).toString();
  console.log("Amplify Checkout Env Started: ", startDateTime);
  const cmd = `cd ${folderUriPath}; amplify env checkout ${env}`;

  // Change the environment to a spinning animation in the status bar
  const statusBarChangingEnv = `$(aws-amplify) Amplify Environment: $(sync~spin)`;
  myStatusBarItem.text = statusBarChangingEnv;

  // Show Progress Notification and close it when the child process emits Close
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Changing Local Amplify Environment from ${await getLocalEnv(
        localEnvFileUri
      )} to ${env}`,
      cancellable: true,
    },
    () => {
      const p = new Promise<void>((resolve, reject) => {
        cp.exec(cmd, (err, stdout) => {
          if (err) {
            vscode.window.showInformationMessage(err.toString());
            return reject(err);
          }
          console.log(stdout);
        }).on("close", async (data) => {
          console.log(data);
          myStatusBarItem.text = `$(aws-amplify) Amplify Environment: ${await getLocalEnv(
            localEnvFileUri
          )}`;
          checkoutEnvUsingStatusBar = false;
          const closeDateTime = new Date(Date.now()).toString();
          console.log("close:", closeDateTime);
          resolve();
        });
      });
      return p;
    }
  );
}

async function createNewAmplifyEnv(options: any) {
  const newEnv = await vscode.window.showInputBox({
    placeHolder: "Name your new Amplify Environment",
  });
  if (
    options.find(
      (option: { label: string | undefined }) => option.label === newEnv
    )
  ) {
    console.log(newEnv, " Already Exists");
    vscode.window.showInformationMessage(
      `The ${newEnv} environment exists already`
    );
  } else {
    console.log("Create New Env ", newEnv);
    if (vscode.window.activeTerminal?.name !== "Amplify Extension Terminal") {
      const terminal = vscode.window.createTerminal(
        "Amplify Extension Terminal"
      );
      terminal.show();
      terminal.sendText(`amplify env add ${newEnv}`);
    } else {
      vscode.window.activeTerminal.sendText(`amplify env add ${newEnv}`);
    }
  }
}
function amplifyPull() {
  if (vscode.window.activeTerminal?.name !== "Amplify Extension Terminal") {
    const terminal = vscode.window.createTerminal("Amplify Extension Terminal");
    terminal.show();
    terminal.sendText(`amplify pull`);
  } else {
    vscode.window.activeTerminal.sendText(`amplify pull`);
  }
}

function amplifyPush() {
  if (vscode.window.activeTerminal?.name !== "Amplify Extension Terminal") {
    const terminal = vscode.window.createTerminal("Amplify Extension Terminal");
    terminal.show();
    terminal.sendText(`amplify push`);
  } else {
    vscode.window.activeTerminal.sendText(`amplify push`);
  }
}

function amplifyStatus() {
  // vscode.window.terminals.find;
  if (vscode.window.activeTerminal?.name !== "Amplify Extension Terminal") {
    const terminal = vscode.window.createTerminal("Amplify Extension Terminal");
    terminal.show();
    terminal.sendText(`amplify status`);
  } else {
    vscode.window.activeTerminal.sendText(`amplify status`);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

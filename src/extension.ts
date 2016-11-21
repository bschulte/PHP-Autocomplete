'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let phpFiles : string[] = [];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "test" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    let indexDisposable = vscode.commands.registerCommand('extension.indexPhpFiles', () => {
        // The code you place here will be executed every time your command is executed
        indexPhpFiles();
    });    

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// Function to handle the indexing of PHP files
function indexPhpFiles(){
    let indexResult = vscode.workspace.findFiles("**/*.php","",1000).then( function(list) {
        if (list){
            list.forEach( (phpFile) => {
                console.log("PHP file: " + phpFile.path);
                phpFiles.push(phpFile.path);
                
                // Read through the PHP file for includes/requires and function definitions
                var lineReader = require('readline').createInterface({
                    input: require('fs').createReadStream(phpFile.path)
                });

                lineReader.on('line', function (line) {
                    console.log('Line from file:', line);
                });

            });
        } else{
            console.log("No workspace defined");
        }
    }, function(reason){
        console.log("Error: " + reason);
    });
}
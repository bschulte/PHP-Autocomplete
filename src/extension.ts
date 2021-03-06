'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PHP_MODE } from './phpMode';
import { PhpSignatureHelpProvider } from './phpFunctionSuggestions';

export let phpFileFunctions = {};
export let phpFileIncludes = {};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Do the initial indexing
    indexPhpFiles();

    vscode.workspace.onDidSaveTextDocument(function (document) {
        indexPhpFiles();
    });

    // Setup our class as a completion item provider for function autocomplete
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(PHP_MODE, {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionItem[] {
            // console.log(document);
            // console.log(position);

            let filename = document.fileName;
            let lineText = document.lineAt(position.line).text;
            let lineTillCurrentPosition = lineText.substr(0, position.character);

            let wordAtPosition = document.getWordRangeAtPosition(position);
            let currentWord = '';
            if (wordAtPosition && wordAtPosition.start.character < position.character) {
                let word = document.getText(wordAtPosition);
                currentWord = word.substr(0, position.character - wordAtPosition.start.character);
            }

            // Check through the list of functions that are included in this file and see if any match
            // the starting letter of the word we have so far
            let suggestions: vscode.CompletionItem[] = [];

            // Check what files the current document includes/requires
            let currentFileName = document.uri.fsPath.replace(vscode.workspace.rootPath, '').slice(1).replace('\\', '/');
            if (currentFileName in phpFileIncludes) {
                // Look through all included/required files for the current document
                phpFileIncludes[currentFileName].forEach(function (file) {
                    if (file in phpFileFunctions) {
                        // Look through all the functions declared in the included/required file
                        phpFileFunctions[file].forEach(function (func) {
                            // If the included/required function starts with the letter of our current word then add it to the set of suggestions
                            if (func.function.startsWith(currentWord)) {
                                let newSuggestion = new vscode.CompletionItem(func.function, vscode.CompletionItemKind.Function)
                                newSuggestion.detail = "PHP file(" + file + ")"
                                suggestions.push(newSuggestion);
                            }
                        });
                    }
                });
            }
            // let completionItem = new vscode.CompletionItem(currentWord + " - PHP", vscode.CompletionItemKind.Function);
            // console.log("Returning completion items");
            // console.log(suggestions);
            return suggestions;

        }
    }));

    // Setup our plugin to help with function signatures
    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(PHP_MODE, new PhpSignatureHelpProvider(vscode.workspace.getConfiguration('php')['docsTool']), '(', ','));

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "PHP-Autocomplete" is now active!');

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

    let printDisposable = vscode.commands.registerCommand('extension.printPhpFiles', () => {
        console.log(phpFileFunctions);
        console.log(phpFileIncludes);
    });
    
    context.subscriptions.push(disposable);
    context.subscriptions.push(indexDisposable);
    context.subscriptions.push(printDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// Function to handle the indexing of PHP files
function indexPhpFiles() {
    // Clear out the cached data
    phpFileIncludes = {};
    phpFileFunctions = {};

    let indexResult = vscode.workspace.findFiles("**/*.php", "", 1000).then(function (list) {
        if (list) {
            let p = new Promise(function (resolve, reject) {
                list.forEach((phpFile) => {
                    let path = phpFile.fsPath;
                    // console.log("PHP file: " + path);
                    let fileName = path.replace(vscode.workspace.rootPath, "").slice(1).replace('\\', '/');
                    if (!(fileName in phpFileFunctions)) {
                        phpFileFunctions[fileName] = [];
                    }

                    // Read through the PHP file for includes/requires and function definitions
                    var lineReader = require('readline').createInterface({
                        input: require('fs').createReadStream(path)
                    });

                    lineReader.on('line', function (line) {
                        // Check for the declaration of a function in this file
                        let functionRegex = /.*function (.*?\))/;
                        let match = functionRegex.exec(line);
                        if (match) {
                            // Parse out the parameters for the function
                            let paramRegex = /(\$.*?)[ ,\)]/gi;

                            let m;
                            let params = [];
                            while ((m = paramRegex.exec(match[1])) !== null) {
                                // This is necessary to avoid infinite loops with zero-width matches
                                if (m.index === paramRegex.lastIndex) {
                                    paramRegex.lastIndex++;
                                }
                                
                                // The result can be accessed through the `m`-variable.
                                m.forEach((match, groupIndex) => {
                                    if (groupIndex == 1){
                                        params.push(match);
                                    }
                                });
                            }

                            phpFileFunctions[fileName].push({function: match[1].split('(')[0], params: params});
                        }

                        // Check for require or includes
                        let includeRegex = /(include.*|require.*)\(*['"](.*?)['"]/;
                        match = includeRegex.exec(line);
                        if (match) {
                            if (!(fileName in phpFileIncludes)) {
                                phpFileIncludes[fileName] = [];
                            }
                            // console.log("Found include (in file: " + fileName + "): " + match[2].replace('../', ''));
                            phpFileIncludes[fileName].push(match[2].replace('../', ''));
                        }
                    });
                });
            }).then(function () {
                // console.log(phpFileFunctions);
            });
        } else {
            console.log("No workspace defined");
        }
    }, function (reason) {
        console.log("Error: " + reason);
    });
}
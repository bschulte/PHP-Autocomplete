'use strict';
import * as vscode from 'vscode';

import cp = require('child_process');
import { languages, window, commands, SignatureHelpProvider, SignatureHelp, SignatureInformation, ParameterInformation, TextDocument, Position, Range, CancellationToken } from 'vscode';
// import { definitionLocation } from './phpDeclaration';
// import { parameters } from './util';
import { phpFileFunctions, phpFileIncludes } from './extension';

export class PhpSignatureHelpProvider implements SignatureHelpProvider {
	private toolForDocs = 'phpdoc';

	constructor(toolForDocs: string) {
		this.toolForDocs = toolForDocs;
	}

	public provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken): Promise<SignatureHelp> {
		let theCall = this.walkBackwardsToBeginningOfCall(document, position);
		if (theCall == null) {
			return Promise.resolve(null);
		}

        // Find the name of the function that's being called
		let functionNameRange = this.previousTokenPosition(document, theCall.openParen);
        let functionName = document.getText(functionNameRange);

		let result = new SignatureHelp();
        let declarationText, sig: string;
        let si: SignatureInformation;

        let currentFileName = document.uri.fsPath.replace(vscode.workspace.rootPath, '').slice(1).replace('\\', '/');
        if (currentFileName in phpFileIncludes) {
            phpFileIncludes[currentFileName].forEach(function (file) {
                if (file in phpFileFunctions) {
                    // Look through all the functions declared in the included/required file
                    phpFileFunctions[file].forEach(function (func) {
                        // If the included/required function starts with the letter of our current word then add it to the set of suggestions
                        if (func.function == functionName) {
                            si = new SignatureInformation(func.function);
                            si.parameters = [];
                            func.params.forEach(function(param){
                                si.parameters.push(param);
                            });

							// Set the documentation of the SignatureInformation to be the full function signature
							si.documentation = file + " : " + func.function + "(" + si.parameters.join(',') + ')';
							
                            result.signatures = [si];
                            result.activeSignature = 0;
                            result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
							result.signatures[0].label = functionName + ": " + result.signatures[0].parameters[result.activeParameter];
                        }
                    });
                }
            });

            // console.log("Result: ", result);
            return Promise.resolve(result);
        } else{
            return Promise.resolve([]);
        }
        
	}

	private previousTokenPosition(document: TextDocument, position: Position): Range {
		while (position.character > 0) {
			let word = document.getWordRangeAtPosition(position);
			if (word) {
				return word;
			}
			position = position.translate(0, -1);
		}
		return null;
	}

	private walkBackwardsToBeginningOfCall(document: TextDocument, position: Position): { openParen: Position, commas: Position[] } {
		let currentLine = document.lineAt(position.line).text.substring(0, position.character);
		let parenBalance = 0;
		let commas = [];
		for (let char = position.character; char >= 0; char--) {
			switch (currentLine[char]) {
				case '(':
					parenBalance--;
					if (parenBalance < 0) {
						return {
							openParen: new Position(position.line, char),
							commas: commas
						};
					}
					break;
				case ')':
					parenBalance++;
					break;
				case ',':
					if (parenBalance === 0) {
						commas.push(new Position(position.line, char));
					}
			}
		}
		return null;
	}

}
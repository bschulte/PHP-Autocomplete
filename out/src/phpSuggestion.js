"use strict";
const vscode = require('vscode');
class PhpSuggestionProvider {
    provideCompletionItems(document, position, token) {
        return this.provideCompletionItemsInternal(document, position, token);
    }
    provideCompletionItemsInternal(document, position, token) {
        return new Promise((resolve, reject) => {
            console.log("Got into our completion provider");
            console.log(document);
            console.log(position);
            let filename = document.fileName;
            let lineText = document.lineAt(position.line).text;
            let lineTillCurrentPosition = lineText.substr(0, position.character);
            // if (lineText.match(/^\s*\/\//)) {
            //     return resolve([]);
            // }
            // Count the number of double quotes in the line till current position. Ignore escaped double quotes
            // let doubleQuotesCnt = (lineTillCurrentPosition.match(/[^\\]\"/g) || []).length;
            // doubleQuotesCnt += lineTillCurrentPosition.startsWith('\"') ? 1 : 0;
            // let inString = (doubleQuotesCnt % 2 === 1);
            // if (!inString && lineTillCurrentPosition.endsWith('\"')) {
            //     return resolve([]);
            // }
            // get current word
            let wordAtPosition = document.getWordRangeAtPosition(position);
            let currentWord = '';
            if (wordAtPosition && wordAtPosition.start.character < position.character) {
                let word = document.getText(wordAtPosition);
                currentWord = word.substr(0, position.character - wordAtPosition.start.character);
            }
            let completionItem = new vscode.CompletionItem(currentWord + " - PHP", vscode.CompletionItemKind.Function);
            return resolve([completionItem]);
            // if (currentWord.match(/^\d+$/)) {
            //     return resolve([]);
            // }
            // let offset = document.offsetAt(position);
            // let inputText = document.getText();
            // let includeUnimportedPkgs = autocompleteUnimportedPackages && !inString;
            // return this.runGoCode(filename, inputText, offset, inString, position, lineText, currentWord, includeUnimportedPkgs).then(suggestions => {
            //     // If no suggestions and cursor is at a dot, then check if preceeding word is a package name
            //     // If yes, then import the package in the inputText and run gocode again to get suggestions
            //     if (suggestions.length === 0 && lineTillCurrentPosition.endsWith('.')) {
            //         let pkgPath = this.getPackagePathFromLine(lineTillCurrentPosition);
            //         if (pkgPath) {
            //             // Now that we have the package path, import it right after the "package" statement
            //             let {imports, pkg} = parseFilePrelude(vscode.window.activeTextEditor.document.getText());
            //             let posToAddImport = document.offsetAt(new vscode.Position(pkg.start + 1 , 0));
            //             let textToAdd = `import "${pkgPath}"\n`;
            //             inputText = inputText.substr(0, posToAddImport) +  textToAdd + inputText.substr(posToAddImport);
            //             offset += textToAdd.length;
            //             // Now that we have the package imported in the inputText, run gocode again
            //             return this.runGoCode(filename, inputText, offset, inString, position, lineText, currentWord, false).then(newsuggestions => {
            //                 // Since the new suggestions are due to the package that we imported,
            //                 // add additionalTextEdits to do the same in the actual document in the editor
            //                 // We use additionalTextEdits instead of command so that 'useCodeSnippetsOnFunctionSuggest' feature continues to work
            //                 newsuggestions.forEach(item => {
            //                     item.additionalTextEdits = [getTextEditForAddImport(pkgPath)];
            //                 });
            //                 resolve(newsuggestions);
            //             });
            //         }
            //     }
            //     resolve(suggestions);
            // });
        });
    }
}
exports.PhpSuggestionProvider = PhpSuggestionProvider;
//# sourceMappingURL=phpSuggestion.js.map
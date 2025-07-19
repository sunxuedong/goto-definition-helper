import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 创建状态栏项
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "Go to Def";
    statusBarItem.tooltip = "Click to go to definition";
    statusBarItem.command = "goto-definition-helper.jumpToDefinition";
    statusBarItem.show();

    // 定义装饰器样式
    const decorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'underline',
        cursor: 'pointer'
    });

    // 注册定义提供者
    const definitionProvider = vscode.languages.registerDefinitionProvider(
        [
            { scheme: 'file', language: 'javascript' },
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'javascriptreact' },
            { scheme: 'file', language: 'typescriptreact' }
        ],
        {
            provideDefinition(document, position, token) {
                const wordRange = document.getWordRangeAtPosition(position);
                const symbol = document.getText(wordRange);

                // 在实际应用中，这里应该实现真正的定义查找逻辑
                // 此处为简化示例，返回当前位置作为定义
                return new vscode.Location(document.uri, position);
            }
        }
    );

    // 注册跳转命令
    const jumpCommand = vscode.commands.registerCommand('goto-definition-helper.jumpToDefinition', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const position = editor.selection.active;
        const locations = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            editor.document.uri,
            position
        );

        if (locations && locations.length > 0) {
            // 跳转到第一个定义位置
            const location = locations[0];
            const newEditor = await vscode.window.showTextDocument(location.uri);
            newEditor.revealRange(new vscode.Range(location.range.start, location.range.start));
            newEditor.selection = new vscode.Selection(location.range.start, location.range.start);
        } else {
            vscode.window.showInformationMessage('No definition found');
        }
    });

    // 更新装饰器
    const updateDecorations = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        const document = editor.document;
        const text = document.getText();

        // 简单匹配单词（实际应用中应使用更复杂的解析）
        const wordPattern = /\b\w+\b/g;
        let match;
        while ((match = wordPattern.exec(text))) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            decorations.push({
                range,
                hoverMessage: `Go to definition of **${match[0]}**`
            });
        }

        editor.setDecorations(decorationType, decorations);
    };

    // 监听编辑器变更
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            updateDecorations();
        }
    }, null, context.subscriptions);

    // 初始更新
    if (vscode.window.activeTextEditor) {
        updateDecorations();
    }

    // 添加到上下文
    context.subscriptions.push(
        statusBarItem,
        definitionProvider,
        jumpCommand,
        decorationType
    );
}

export function deactivate() { }
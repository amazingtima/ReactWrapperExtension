import * as vscode from 'vscode';

function getActiveEditor(): vscode.TextEditor | undefined {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('React Wrapper: открой файл и выдели код.');
	}
	return editor;
}

function getIndentUnit(editor: vscode.TextEditor): string {
	const tabSize = Number(editor.options.tabSize) || 2;
	return editor.options.insertSpaces ? ' '.repeat(tabSize) : '\t';
}

function escapeSnippet(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
}

function indentLines(text: string, indent: string): string {
	return text
		.split('\n')
		.map((line) => (line.length ? indent + line : line))
		.join('\n');
}

function wrapWithSnippet(
	editor: vscode.TextEditor,
	build: (selectedText: string, indent: string) => string
): void {
	const selection = editor.selection;
	const selectedText = editor.document.getText(selection);

	if (!selectedText.trim()) {
		vscode.window.showWarningMessage('React Wrapper: сначала выдели код.');
		return;
	}

	const indent = getIndentUnit(editor);
	const snippet = new vscode.SnippetString(build(selectedText, indent));
	editor.insertSnippet(snippet, selection);
}

function registerWrapCommand(
	command: string,
	build: (selectedText: string, indent: string) => string
): vscode.Disposable {
	return vscode.commands.registerCommand(command, () => {
		const editor = getActiveEditor();
		if (!editor) {
			return;
		}
		wrapWithSnippet(editor, build);
	});
}

export function activate(context: vscode.ExtensionContext) {
	const commands = [
		registerWrapCommand('react-wrapper.consoleLog', (selectedText) => {
			const label = escapeSnippet(selectedText.trim());
			return `console.log('${label}:', ${escapeSnippet(selectedText)});`;
		}),

		registerWrapCommand('react-wrapper.jsxContainer', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `<div className="\${1:}">\n${body}\n</div>`;
		}),

		registerWrapCommand('react-wrapper.jsxCondition', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `{\${1:isOpen} && (\n${body}\n)}`;
		}),

		registerWrapCommand('react-wrapper.jsxTernary', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `{\${1:condition} ? (\n${body}\n) : \${2:null}}`;
		}),

		registerWrapCommand('react-wrapper.jsxFragment', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `<>\n${body}\n</>`;
		}),

		registerWrapCommand('react-wrapper.tryCatch', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `try {\n${body}\n} catch (\${1:error}) {\n${indent}console.error(\${1:error});\n}`;
		}),

		registerWrapCommand('react-wrapper.useEffect', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `useEffect(() => {\n${body}\n}, [\${1:}]);`;
		}),

		registerWrapCommand('react-wrapper.asyncHandler', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent + indent));
			return `async () => {\n${indent}try {\n${body}\n${indent}} catch (\${1:error}) {\n${indent}${indent}console.error(\${1:error});\n${indent}}\n}`;
		}),

		registerWrapCommand('react-wrapper.useState', (selectedText) => {
			return `useState(\${1:${escapeSnippet(selectedText.trim())}})`;
		}),

		registerWrapCommand('react-wrapper.jsxMap', (selectedText, indent) => {
			const body = escapeSnippet(indentLines(selectedText, indent));
			return `{\${1:items}.map((\${2:item}) => (\n${body}\n))}`;
		}),
	];

	context.subscriptions.push(...commands);
}

export function deactivate() {}

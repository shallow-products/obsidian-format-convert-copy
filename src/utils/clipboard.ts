import { Notice, Platform } from "obsidian";
import { t } from "../i18n";

/**
 * Writes every given MIME type to the clipboard in a single operation by handling a synthetic
 * `copy` event. Returns true only when the handler actually ran and the copy command succeeded.
 */
function writeViaCopyEvent(formats: Record<string, string>): boolean {
	try {
		const doc = typeof activeDocument !== "undefined" ? activeDocument : document;
		let handled = false;
		const onCopy = (event: ClipboardEvent) => {
			if (!event.clipboardData) return;
			for (const [mime, content] of Object.entries(formats)) {
				event.clipboardData.setData(mime, content);
			}
			event.preventDefault();
			// Stop the focused editor's own copy handler from adding a stray text/html of its selection
			event.stopImmediatePropagation();
			handled = true;
		};
		doc.addEventListener("copy", onCopy, true);
		try {
			return doc.execCommand("copy") && handled;
		} finally {
			doc.removeEventListener("copy", onCopy, true);
		}
	} catch (error) {
		console.warn("format-convert-copy: copy event write failed, trying standard clipboard", error);
		return false;
	}
}

/**
 * Copies text (and HTML / custom MIME types where supported) to the OS clipboard.
 * Performs optimal fallback handling across mobile (iOS / Android) and desktop environments.
 */
export async function copyToClipboard(
	text: string,
	label: string,
	html?: string,
	showNotification: boolean = true,
	customMimeTypes?: Record<string, string>
): Promise<boolean> {
	const notifySuccess = (message: string) => {
		if (showNotification) {
			new Notice(message);
		}
	};

	// 1. Custom MIME types (e.g., slack/texty for Desktop Slack native clipboard)
	// Electron's clipboard.writeBuffer replaces the whole clipboard on every call, so multiple formats
	// cannot coexist that way. Writing through a DOM copy event stores every format in one operation,
	// letting the paste target pick the richest format it understands (slack/texty) or fall back to text/plain.
	if (customMimeTypes && Object.keys(customMimeTypes).length > 0) {
		if (!Platform.isMobile) {
			const formats: Record<string, string> = { "text/plain": text, ...customMimeTypes };
			if (html) formats["text/html"] = html;
			if (writeViaCopyEvent(formats)) {
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		}
	}

	// 2. Rich text write (HTML + Plain Text) for Slack and other rich-text editors
	if (html) {
		// Method A: Desktop Electron clipboard (synchronous rich write)
		if (!Platform.isMobile) {
			try {
				const windowWithRequire = (typeof activeWindow !== "undefined" ? activeWindow : window) as unknown as {
					require?: (module: string) => { clipboard?: { write?: (data: { text: string; html?: string }) => void } };
				};
				const electron = typeof windowWithRequire.require === "function" ? windowWithRequire.require("electron") : null;

				if (electron?.clipboard && typeof electron.clipboard.write === "function") {
					electron.clipboard.write({ text, html });
					notifySuccess(t("noticeCopied", { format: label }));
					return true;
				}
			} catch {
				// Proceed to Web Clipboard API
			}
		}

		// Method B: Modern Async Clipboard API with ClipboardItem (iOS 13.4+, Android, Chrome/Safari)
		try {
			if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
				const item = new ClipboardItem({
					"text/plain": new Blob([text], { type: "text/plain" }),
					"text/html": new Blob([html], { type: "text/html" }),
				});
				await navigator.clipboard.write([item]);
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		} catch (clipboardItemError) {
			console.warn("format-convert-copy: ClipboardItem write failed, falling back to plain text", clipboardItemError);
		}
	}

	// 3. Plain text fallback (for plain text formats like raw Markdown or when rich text write fails)
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			notifySuccess(
				html
					? t("noticeCopiedSimple", { format: label })
					: t("noticeCopied", { format: label })
			);
			return true;
		}
	} catch (error) {
		console.warn("format-convert-copy: writeText failed", error);
	}

	new Notice(t("noticeFailed"));
	return false;
}

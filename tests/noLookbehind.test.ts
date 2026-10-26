import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Regex lookbehind is not supported by iOS before 16.4, which Obsidian mobile still runs on.
function listSourceFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return listSourceFiles(full);
		return entry.name.endsWith(".ts") ? [full] : [];
	});
}

describe("iOS compatibility", () => {
	it("does not use regex lookbehind in plugin source", () => {
		const offenders = listSourceFiles(path.join(__dirname, "..", "src")).filter((file) =>
			/\(\?<[!=]/.test(fs.readFileSync(file, "utf8"))
		);
		expect(offenders).toEqual([]);
	});
});

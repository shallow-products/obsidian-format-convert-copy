import { describe, expect, it } from "vitest";
import { resolveWikilinks } from "../src/converters/common";
import { convertToDiscord } from "../src/converters/discord";
import { convertToSlack, convertToSlackHtml } from "../src/converters/slack";
import { convertToSlackMobileHtml } from "../src/converters/slackMobile";
import { convertToSlackTexty } from "../src/converters/slackTexty";
import { convertToWhatsApp } from "../src/converters/whatsapp";

// A link target that never closes used to trigger exponential backtracking
// (about 2s at 28 repetitions, doubling with every extra one).
const REPEAT = 5000;
const LIMIT_MS = 1000;
const unclosedLink = "[a](" + "'".repeat(REPEAT);
const unclosedImage = "![a](" + "'".repeat(REPEAT);

function elapsed(fn: () => unknown): number {
	const start = performance.now();
	fn();
	return performance.now() - start;
}

describe("regex backtracking safety (ReDoS)", () => {
	const converters: Array<[string, (md: string) => unknown]> = [
		["convertToSlack", convertToSlack],
		["convertToSlackHtml", convertToSlackHtml],
		["convertToSlackMobileHtml", convertToSlackMobileHtml],
		["convertToSlackTexty", convertToSlackTexty],
		["convertToDiscord", convertToDiscord],
		["convertToWhatsApp", convertToWhatsApp],
	];

	for (const [name, convert] of converters) {
		it(`${name} handles an unclosed link target in linear time`, () => {
			expect(elapsed(() => convert(unclosedLink))).toBeLessThan(LIMIT_MS);
		});
	}

	it("resolveWikilinks handles an unclosed image target in linear time", () => {
		expect(elapsed(() => resolveWikilinks(unclosedImage))).toBeLessThan(LIMIT_MS);
	});

	it("still converts links whose URL contains balanced parentheses", () => {
		expect(convertToWhatsApp("[t](http://a.com/x_(y))")).toContain("http://a.com/x_(y)");
	});
});

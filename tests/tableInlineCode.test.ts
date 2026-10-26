import { describe, expect, it } from "vitest";
import { convertToDiscord } from "../src/converters/discord";
import { convertToSlack, convertToSlackHtml } from "../src/converters/slack";
import { convertToSlackMobileHtml } from "../src/converters/slackMobile";
import { parseInlineToOps } from "../src/converters/slackTexty";
import { convertToWhatsApp } from "../src/converters/whatsapp";

const PRIVATE_USE = /[-]/;
const table = "| Command | Info |\n| :-- | :-- |\n| `/ban` | Admin |\n| $x_1$ | Math |\n";

describe("inline code and math inside table cells", () => {
	const converters: Array<[string, (md: string) => string]> = [
		["convertToSlack", convertToSlack],
		["convertToSlackHtml", convertToSlackHtml],
		["convertToSlackMobileHtml", convertToSlackMobileHtml],
		["convertToDiscord", convertToDiscord],
		["convertToWhatsApp", convertToWhatsApp],
	];

	for (const [name, convert] of converters) {
		it(`${name} keeps the original cell text and leaks no placeholder`, () => {
			const out = convert(table);
			expect(out).not.toMatch(PRIVATE_USE);
			expect(out).toContain("/ban");
			expect(out).toContain("$x_1$");
		});
	}

	it("keeps table columns aligned when a cell contains inline code", () => {
		const lines = convertToDiscord(table).split("\n").filter((l) => l.startsWith("|"));
		const widths = new Set(lines.map((l) => l.length));
		expect(widths.size).toBe(1);
	});
});

describe("intra-word underscores in Slack rich text", () => {
	const italicText = (text: string) =>
		parseInlineToOps(text)
			.filter((op) => op.attributes?.italic)
			.map((op) => op.insert);

	it("does not italicize snake_case words", () => {
		expect(italicText("use snake_case_word here")).toEqual([]);
	});

	it("still italicizes underscore emphasis around separate words", () => {
		expect(italicText("an _italic_ word")).toEqual(["italic"]);
	});
});

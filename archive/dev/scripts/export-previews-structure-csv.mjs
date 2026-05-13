import { readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const previewsDir = path.join(rootDir, "previews");
const outputDir = path.join(rootDir, "exports");
const outputJsonFile = path.join(outputDir, "section-structure.json");
const args = new Set(process.argv.slice(2));

function parseExpectedCount(prefix, fallback) {
  const arg = [...args].find((entry) => entry.startsWith(prefix));
  if (!arg) return fallback;

  const value = Number(arg.slice(prefix.length));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid argument ${prefix}<number>: received '${arg}'`);
  }

  return value;
}

const validateStructure = !args.has("--no-validate");
const expectedVariantsPerCategory = parseExpectedCount("--expect-variants=", null);
const expectedGraphicsPerVariant = parseExpectedCount("--expect-graphics=", null);

function extractNumber(name) {
  const match = name.match(/(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

async function listDirectories(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function listSvgFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".svg"))
    .map((entry) => entry.name);
}

async function main() {
  const rows = [];
  const validationIssues = [];
  const categories = (await listDirectories(previewsDir)).sort((a, b) => a.localeCompare(b, "pl"));

  for (const categoryId of categories) {
    const categoryDir = path.join(previewsDir, categoryId);
    const variantDirs = (await listDirectories(categoryDir)).sort((a, b) => extractNumber(a) - extractNumber(b));

    if (
      validateStructure &&
      expectedVariantsPerCategory !== null &&
      variantDirs.length !== expectedVariantsPerCategory
    ) {
      validationIssues.push(
        `Category '${categoryId}' has ${variantDirs.length} variants (expected ${expectedVariantsPerCategory}).`
      );
    }

    for (const variantDirName of variantDirs) {
      const variantDir = path.join(categoryDir, variantDirName);
      const variantNo = extractNumber(variantDirName);
      const graphics = (await listSvgFiles(variantDir)).sort((a, b) => extractNumber(a) - extractNumber(b));

      if (
        validateStructure &&
        expectedGraphicsPerVariant !== null &&
        graphics.length !== expectedGraphicsPerVariant
      ) {
        validationIssues.push(
          `Category '${categoryId}', ${variantDirName} has ${graphics.length} graphics (expected ${expectedGraphicsPerVariant}).`
        );
      }

      for (const graphicFile of graphics) {
        const graphicNo = extractNumber(graphicFile);
        const relativePath = path.posix.join("previews", categoryId, variantDirName, graphicFile);

        rows.push({
          section: "category-products-panel",
          category_id: categoryId,
          variant: Number.isFinite(variantNo) ? variantNo : "",
          graphic: Number.isFinite(graphicNo) ? graphicNo : "",
          file: relativePath,
        });
      }
    }
  }

  if (validateStructure && validationIssues.length > 0) {
    const previewIssues = validationIssues.slice(0, 25);
    console.error("Structure validation failed. Fix these issues before export:");
    previewIssues.forEach((issue) => console.error(` - ${issue}`));

    if (validationIssues.length > previewIssues.length) {
      console.error(` - ...and ${validationIssues.length - previewIssues.length} more issue(s).`);
    }

    throw new Error(
      `Validation failed with ${validationIssues.length} issue(s). ` +
      "Use --no-validate to skip checks or --expect-variants/--expect-graphics to override expectations."
    );
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    outputJsonFile,
    `${JSON.stringify({
      section: "category-products-panel",
      total_rows: rows.length,
      generated_at: new Date().toISOString(),
      rows,
    }, null, 2)}\n`,
    "utf8"
  );

  console.log(`JSON generated: ${outputJsonFile}`);

  if (validateStructure) {
    if (expectedVariantsPerCategory !== null || expectedGraphicsPerVariant !== null) {
      console.log(
        "Validation passed with expectations: " +
        `${expectedVariantsPerCategory ?? "any"} variant(s)/category, ` +
        `${expectedGraphicsPerVariant ?? "any"} graphic(s)/variant.`
      );
    } else {
      console.log("Validation passed: flexible mode (no fixed variant/graphic limits).");
    }
  }

  console.log(`Rows: ${rows.length}`);
}

main().catch((error) => {
  console.error("Failed to export JSON:", error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";
import test from "node:test";
import { ESLint } from "eslint";

test("keeps React and accessibility rules active through the ESLint compatibility adapter", async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(
    'import { memo } from "react"; export default memo(function () { return <img src="x" />; });',
    { filePath: "app/compat-probe.tsx" },
  );
  const rules = result.messages.map((message) => message.ruleId);
  assert.ok(rules.includes("react/display-name"));
  assert.ok(rules.includes("jsx-a11y/alt-text"));
});

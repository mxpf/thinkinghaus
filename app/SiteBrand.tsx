/* eslint-disable @next/next/no-html-link-for-pages */
import { SITE_NAME } from "../site-config.mjs";
import { LetterCascade } from "./LetterCascade";

export function SiteBrand() {
  return (
    <a className="desktop-brand" href="/">
      <LetterCascade text={SITE_NAME} />
    </a>
  );
}

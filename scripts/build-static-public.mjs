import { resolve } from "node:path";
import { buildStaticPublic, verifyStaticPublic } from "@mxpf/write-placid-core/static-public";

const sourceDirectory = resolve("dist/client");
const outputDirectory = resolve("dist/public");

const result = await buildStaticPublic({
  sourceDirectory,
  outputDirectory,
  canvasColor: "#1a1814",
  colorScheme: "dark",
  viewTransitions: true,
  enhancements: {
    typographyGuards: true,
    scrollProgress: true,
    scrollProgressSelector: ".scroll-progress",
    scrollFade: true,
    scrollFadeSelector: ".article-image",
    footerReveal: true,
    footerSelector: ".footer--end-reveal",
  },
});

const verification = await verifyStaticPublic({ outputDirectory });
console.log(JSON.stringify({ result, verification }, null, 2));

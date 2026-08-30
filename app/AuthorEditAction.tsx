import { STUDIO_URL } from "../site-config.mjs";

export function AuthorEditAction() {
  return (
    <p className="author-edit-action" hidden>
      <a href={STUDIO_URL}>Edit</a>
    </p>
  );
}

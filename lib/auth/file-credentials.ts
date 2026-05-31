import { readFile } from "node:fs/promises";
import path from "node:path";

type Credential = {
  uid?: string;
  username?: string;
  password?: string;
};

type CredentialFile =
  | Credential
  | Credential[]
  | {
      users?: Credential[];
    };

export function getCredentialFilePath(): string {
  return process.env.GOVDOC_AUTH_FILE ?? path.join(process.cwd(), "data", "users.json");
}

export async function verifyFileCredential(username: string, password: string): Promise<boolean> {
  const raw = await readFile(getCredentialFilePath(), "utf8");
  const parsed = JSON.parse(raw) as CredentialFile;

  let users: Credential[];

  if (Array.isArray(parsed)) {
    users = parsed;
  } else if (Array.isArray(parsed.users)) {
    users = parsed.users;
  } else {
    users = [parsed];
  }

  return users.some((user) => {
    const uid = user.uid ?? user.username;
    return uid === username && user.password === password;
  });
}

import { readFile } from "node:fs/promises";
import path from "node:path";

type Credential = {
  uid?: string;
  username?: string;
  password?: string;
};

type CredentialFile =
  | Credential
  | {
      users?: Credential[];
    };

export function getCredentialFilePath(): string {
  return process.env.GOVDOC_AUTH_FILE ?? path.join(process.cwd(), "auth.local.json");
}

function normalizeCredentials(parsed: CredentialFile): Credential[] {
  return Array.isArray((parsed as { users?: Credential[] }).users)
    ? (parsed as { users: Credential[] }).users
    : [parsed as Credential];
}

function verifyCredentialList(credentials: Credential[], username: string, password: string): boolean {
  return credentials.some((user) => {
    const uid = user.uid ?? user.username;
    return uid === username && user.password === password;
  });
}

function getEnvironmentCredentials(): Credential[] | null {
  if (process.env.GOVDOC_AUTH_JSON) {
    return normalizeCredentials(JSON.parse(process.env.GOVDOC_AUTH_JSON) as CredentialFile);
  }

  if (process.env.GOVDOC_AUTH_USERNAME && process.env.GOVDOC_AUTH_PASSWORD) {
    return [
      {
        username: process.env.GOVDOC_AUTH_USERNAME,
        password: process.env.GOVDOC_AUTH_PASSWORD,
      },
    ];
  }

  return null;
}

export async function verifyFileCredential(username: string, password: string): Promise<boolean> {
  const environmentCredentials = getEnvironmentCredentials();
  if (environmentCredentials) {
    return verifyCredentialList(environmentCredentials, username, password);
  }

  const raw = await readFile(getCredentialFilePath(), "utf8");
  const parsed = JSON.parse(raw) as CredentialFile;
  return verifyCredentialList(normalizeCredentials(parsed), username, password);
}

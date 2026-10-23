import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function imageType(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export function createProfileImageStore(directory) {
  const fileFor = (identity) => {
    if (identity !== "venue" && !/^[a-z0-9_]{3,24}$/.test(identity)) throw Object.assign(new Error("That profile could not be found."), { status: 404 });
    return path.join(directory, identity === "venue" ? "venue.image" : `${identity}.image`);
  };

  async function save(identity, buffer, declaredType) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw Object.assign(new Error("Choose an image to upload."), { status: 400 });
    if (buffer.length > MAX_PROFILE_IMAGE_SIZE) throw Object.assign(new Error("Profile images must be 2 MB or smaller."), { status: 413 });
    const actualType = imageType(buffer);
    if (!CONTENT_TYPES.has(declaredType) || actualType !== declaredType) throw Object.assign(new Error("Use a valid PNG, JPEG, or WebP image."), { status: 415 });

    await mkdir(directory, { recursive: true });
    const target = fileFor(identity);
    const temporary = `${target}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(temporary, buffer, { mode: 0o600, flag: "wx" });
      await rename(temporary, target);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      throw error;
    }
    return { url: identity === "venue" ? "/api/profile-images/venue" : `/api/profile-images/members/${encodeURIComponent(identity)}` };
  }

  async function remove(identity) {
    await unlink(fileFor(identity)).catch((error) => { if (error.code !== "ENOENT") throw error; });
  }

  async function read(identity) {
    try {
      const buffer = await readFile(fileFor(identity));
      return { buffer, contentType: imageType(buffer) };
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async function clear() {
    for (const name of await readdir(directory).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error))) {
      if (name.endsWith(".image")) await unlink(path.join(directory, name));
    }
  }

  return { save, remove, read, clear };
}

import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_CONTENT_LENGTH = 2000;

function validateText(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw Object.assign(new TypeError("Enter some text before publishing."), { status: 400 });
  }
  const normalized = text.trim();
  if (normalized.length > MAX_CONTENT_LENGTH) {
    throw Object.assign(new TypeError(`Keep posts and comments to ${MAX_CONTENT_LENGTH} characters or fewer.`), { status: 400 });
  }
  return normalized;
}

function missingItem(message) {
  return Object.assign(new Error(message), { status: 404 });
}

function forbidden(message = "You can only edit or delete your own content.") {
  return Object.assign(new Error(message), { status: 403 });
}

export function createCommunityStore(filePath) {
  let posts = [];
  let mutationQueue = Promise.resolve();

  async function load() {
    try {
      posts = JSON.parse(await readFile(filePath, "utf8"));
      if (!Array.isArray(posts)) throw new Error("Community content file must contain a list.");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async function persist(nextPosts) {
    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryFile = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(temporaryFile, `${JSON.stringify(nextPosts, null, 2)}\n`, { mode: 0o600 });
      await rename(temporaryFile, filePath);
    } catch (error) {
      await unlink(temporaryFile).catch(() => {});
      throw error;
    }
  }

  async function mutate(operation) {
    let release;
    const previous = mutationQueue;
    mutationQueue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const nextPosts = structuredClone(posts);
      const result = await operation(nextPosts);
      await persist(nextPosts);
      posts = nextPosts;
      return result;
    } finally {
      release();
    }
  }

  function publicAuthor(item) {
    return item.authorKey && !item.anonymous ? item.authorName : "Anonymous";
  }

  function publicComment(comment, viewerKey) {
    return {
      id: comment.id,
      text: comment.text,
      author: publicAuthor(comment),
      anonymous: Boolean(comment.anonymous || !comment.authorKey),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      canEdit: Boolean(viewerKey && comment.authorKey === viewerKey),
    };
  }

  function publicPost(post, viewerKey) {
    return {
      id: post.id,
      text: post.text,
      author: publicAuthor(post),
      anonymous: Boolean(post.anonymous || !post.authorKey),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      canEdit: Boolean(viewerKey && post.authorKey === viewerKey),
      comments: post.comments.map((comment) => publicComment(comment, viewerKey)),
    };
  }

  function moderationComment(comment) {
    return {
      ...publicComment(comment, null),
      author: comment.authorKey ? comment.authorName : "Anonymous guest",
      anonymous: Boolean(comment.anonymous || !comment.authorKey),
    };
  }

  function moderationPost(post) {
    return {
      ...publicPost(post, null),
      author: post.authorKey ? post.authorName : "Anonymous guest",
      anonymous: Boolean(post.anonymous || !post.authorKey),
      comments: post.comments.map(moderationComment),
    };
  }

  async function createPost({ text, author, anonymous = true }) {
    const content = validateText(text);
    const post = {
      id: randomUUID(),
      text: content,
      authorKey: author?.key || null,
      authorName: author?.username || null,
      anonymous: author ? Boolean(anonymous) : true,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      comments: [],
    };
    await mutate((nextPosts) => { nextPosts.unshift(post); });
    return post.id;
  }

  async function updatePost({ postId, text, authorKey, isModerator = false }) {
    const content = validateText(text);
    await mutate((nextPosts) => {
      const post = nextPosts.find((item) => item.id === postId);
      if (!post) throw missingItem("That post could not be found.");
      if (!isModerator && (!authorKey || post.authorKey !== authorKey)) throw forbidden();
      post.text = content;
      post.updatedAt = new Date().toISOString();
    });
  }

  async function deletePost({ postId, authorKey, isModerator = false }) {
    await mutate((nextPosts) => {
      const index = nextPosts.findIndex((item) => item.id === postId);
      if (index < 0) throw missingItem("That post could not be found.");
      if (!isModerator && (!authorKey || nextPosts[index].authorKey !== authorKey)) throw forbidden();
      nextPosts.splice(index, 1);
    });
  }

  async function createComment({ postId, text, author, anonymous = true }) {
    const content = validateText(text);
    const comment = {
      id: randomUUID(),
      text: content,
      authorKey: author?.key || null,
      authorName: author?.username || null,
      anonymous: author ? Boolean(anonymous) : true,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    await mutate((nextPosts) => {
      const post = nextPosts.find((item) => item.id === postId);
      if (!post) throw missingItem("That post could not be found.");
      post.comments.push(comment);
    });
    return comment.id;
  }

  async function updateComment({ postId, commentId, text, authorKey, isModerator = false }) {
    const content = validateText(text);
    await mutate((nextPosts) => {
      const post = nextPosts.find((item) => item.id === postId);
      if (!post) throw missingItem("That post could not be found.");
      const comment = post.comments.find((item) => item.id === commentId);
      if (!comment) throw missingItem("That comment could not be found.");
      if (!isModerator && (!authorKey || comment.authorKey !== authorKey)) throw forbidden();
      comment.text = content;
      comment.updatedAt = new Date().toISOString();
    });
  }

  async function deleteComment({ postId, commentId, authorKey, isModerator = false }) {
    await mutate((nextPosts) => {
      const post = nextPosts.find((item) => item.id === postId);
      if (!post) throw missingItem("That post could not be found.");
      const index = post.comments.findIndex((item) => item.id === commentId);
      if (index < 0) throw missingItem("That comment could not be found.");
      if (!isModerator && (!authorKey || post.comments[index].authorKey !== authorKey)) throw forbidden();
      post.comments.splice(index, 1);
    });
  }

  async function clear() {
    await mutate((nextPosts) => { nextPosts.splice(0); });
  }

  return {
    load,
    list: (viewerKey = null) => posts.map((post) => publicPost(post, viewerKey)),
    listForModeration: () => posts.map(moderationPost),
    createPost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment,
    clear,
  };
}

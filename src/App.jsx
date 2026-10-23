import { useCallback, useEffect, useState } from "react";
import projectLogo from "./assets/project-logo.jpg";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function initials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((word) => word[0]) : [words[0]?.[0] || "?"]).join("").toUpperCase();
}

function Avatar({ src, name, anonymous = false, className = "avatar-dot" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className={className} aria-hidden="true">{src && !anonymous && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : initials(anonymous ? "A" : name)}</div>;
}

function memberImageUrl(username) {
  return `/api/profile-images/members/${encodeURIComponent(username.toLowerCase())}`;
}

function ProfileImageCrop({ file, onCancel, onConfirm, busy }) {
  const [source, setSource] = useState("");
  const [image, setImage] = useState(null);
  const [offset, setOffset] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const makeCrop = () => {
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - side) * offset.x;
    const sy = (image.naturalHeight - side) * offset.y;
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    canvas.getContext("2d").drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
    canvas.toBlob((blob) => blob && onConfirm(new File([blob], "profile-crop.png", { type: "image/png" })), "image/png");
  };
  const side = image ? Math.min(image.naturalWidth, image.naturalHeight) : 0;
  const previewScale = image ? 320 / side : 1;
  const previewWidth = image ? image.naturalWidth * previewScale : 0;
  const previewHeight = image ? image.naturalHeight * previewScale : 0;
  return <div className="crop-backdrop" role="presentation"><section className="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title"><h2 id="crop-title">Crop profile picture</h2><p>Adjust the square crop with the controls, then save.</p><div className="crop-window">{source && <img className="crop-source" src={source} alt="Image to crop" onLoad={(event) => setImage(event.currentTarget)} style={{ width: previewWidth, height: previewHeight, left: image ? -((image.naturalWidth - side) * offset.x * previewScale) : 0, top: image ? -((image.naturalHeight - side) * offset.y * previewScale) : 0 }} />}</div><div className="crop-controls"><label>Horizontal crop <input aria-label="Horizontal crop position" type="range" min="0" max="100" value={offset.x * 100} onChange={(event) => setOffset((value) => ({ ...value, x: Number(event.target.value) / 100 }))} disabled={!image || image?.naturalWidth <= image?.naturalHeight} /></label><label>Vertical crop <input aria-label="Vertical crop position" type="range" min="0" max="100" value={offset.y * 100} onChange={(event) => setOffset((value) => ({ ...value, y: Number(event.target.value) / 100 }))} disabled={!image || image?.naturalHeight <= image?.naturalWidth} /></label></div><div className="crop-actions"><button type="button" className="text-button" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="primary-button" onClick={makeCrop} disabled={!image || !side || busy}>{busy ? "Saving…" : "Use crop"}</button></div></section></div>;
}

function GuestWelcome() {
  const [screen, setScreen] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [availability, setAvailability] = useState("");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [feedError, setFeedError] = useState("");
  const [postText, setPostText] = useState("");
  const [postAnonymous, setPostAnonymous] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentAnonymous, setCommentAnonymous] = useState({});
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [communityTab, setCommunityTab] = useState("feed");
  const [enabledModules, setEnabledModules] = useState([]);
  const [venueName, setVenueName] = useState("LOCOMI");
  const [venueImageUrl, setVenueImageUrl] = useState("/api/profile-images/venue");
  const [profileImageError, setProfileImageError] = useState("");
  const [pendingProfileImage, setPendingProfileImage] = useState(null);
  const [profileImageBusy, setProfileImageBusy] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [noteName, setNoteName] = useState("");
  const [showNoteDate, setShowNoteDate] = useState(true);
  const [notePosition, setNotePosition] = useState({ x: 0.39, y: 0.36 });
  const [noteError, setNoteError] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteCooldownUntil, setNoteCooldownUntil] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [guestSubmissions, setGuestSubmissions] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("local-community-note-submissions") || "[]"); return Array.isArray(saved) ? saved : []; } catch { return []; }
  });
  const [submissionMessage, setSubmissionMessage] = useState("");

  useEffect(() => {
    let active = true;
    requestJson("/api/account/session")
      .then((result) => {
        if (!active) return;
        setUser(result.user ? { ...result.user, profileImageUrl: memberImageUrl(result.user.username) } : null);
        if (result.user) setNoteName(result.user.username);
        if (result.user) setScreen("feed");
      })
      .catch(() => {})
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!noteCooldownUntil || currentTime >= noteCooldownUntil) return undefined;
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [noteCooldownUntil, currentTime]);

  const refreshFeed = useCallback(async () => {
    try {
      const result = await requestJson("/api/community/feed");
      const version = Date.now();
      setPosts(result.posts.map((post) => ({ ...post, profileImageUrl: post.profileImageUrl ? `${post.profileImageUrl}?v=${version}` : null, comments: post.comments.map((comment) => ({ ...comment, profileImageUrl: comment.profileImageUrl ? `${comment.profileImageUrl}?v=${version}` : null })) })));
      setFeedError("");
    } catch (reason) {
      setFeedError(reason.message);
    }
  }, []);

  const refreshCommunityConfig = useCallback(async () => {
    try {
      const { community } = await requestJson("/api/community/config");
      setVenueName(community?.venueName || "LOCOMI");
      setVenueImageUrl(`${community?.profileImageUrl || "/api/profile-images/venue"}?v=${Date.now()}`);
      const modules = community?.enabledModules || [];
      setEnabledModules(modules);
      setCommunityTab((current) => modules.includes(current) ? current : modules[0] || "");
    } catch { /* Keep the current guest view if the community configuration is temporarily unavailable. */ }
  }, []);

  async function updateMemberImage(file) {
    setProfileImageError("");
    try {
      if (file) {
        setProfileImageBusy(true);
        const response = await fetch("/api/account/profile-image", { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Could not save the profile image.");
      } else await requestJson("/api/account/profile-image", { method: "DELETE" });
      setUser((current) => ({ ...current, profileImageUrl: `${memberImageUrl(current.username)}?v=${Date.now()}` }));
    } catch (reason) { setProfileImageError(reason.message); }
    finally { setProfileImageBusy(false); setPendingProfileImage(null); }
  }

  const refreshNoteboard = useCallback(async () => {
    try {
      const result = await requestJson("/api/community/noteboard");
      const version = Date.now();
      setNotes(result.notes.map((note) => ({ ...note, profileImageUrl: note.profileImageUrl ? `${note.profileImageUrl}?v=${version}` : null })));
      setNoteError("");
    } catch (reason) { setNoteError(reason.message); }
  }, []);

  useEffect(() => {
    if (screen !== "feed") return undefined;
    const events = new EventSource("/api/community/events");
    events.onopen = () => { refreshFeed(); refreshCommunityConfig(); };
    events.addEventListener("feed-changed", refreshFeed);
    events.addEventListener("noteboard-changed", refreshNoteboard);
    events.addEventListener("community-changed", refreshCommunityConfig);
    return () => events.close();
  }, [screen, refreshFeed, refreshNoteboard, refreshCommunityConfig]);

  useEffect(() => {
    refreshCommunityConfig();
  }, [refreshCommunityConfig]);

  useEffect(() => {
    if (screen !== "feed") return;
    refreshNoteboard();
  }, [screen, refreshNoteboard]);

  useEffect(() => {
    localStorage.setItem("local-community-note-submissions", JSON.stringify(guestSubmissions));
  }, [guestSubmissions]);

  useEffect(() => {
    if (screen !== "feed" || user || guestSubmissions.length === 0) return undefined;
    let active = true;
    const check = async () => {
      const remaining = [];
      for (const submission of guestSubmissions) {
        try {
          const status = await requestJson("/api/community/noteboard/submission", { headers: { "X-Submission-Token": submission.token } });
          if (status.state === "published") {
            setSubmissionMessage("Your note is on the board.");
            refreshNoteboard();
          } else remaining.push({ ...submission, ...status });
        } catch {
          setSubmissionMessage("A guest submission has ended. Check the board to see if it was published; rejected or expired submissions are cleared automatically.");
          refreshNoteboard();
        }
      }
      if (active) setGuestSubmissions((current) => JSON.stringify(current) === JSON.stringify(remaining) ? current : remaining);
    };
    check();
    const timer = window.setInterval(check, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [screen, user, guestSubmissions, refreshNoteboard]);

  useEffect(() => {
    const trimmed = username.trim();
    if (screen !== "register" || !/^[A-Za-z0-9_]{3,24}$/.test(trimmed)) {
      setAvailability("");
      return undefined;
    }
    let active = true;
    setAvailability("Checking username…");
    const timer = window.setTimeout(() => {
      requestJson(`/api/account/availability?username=${encodeURIComponent(trimmed)}`)
        .then(({ available }) => { if (active) setAvailability(available ? "Username is available." : "That username is unavailable."); })
        .catch(() => { if (active) setAvailability("Could not check username availability."); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [username, screen]);

  async function submitAccount(event) {
    event.preventDefault();
    setError("");
    if (screen === "register" && password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await requestJson(`/api/account/${screen === "register" ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (screen === "login") {
        setUser({ ...result.user, profileImageUrl: memberImageUrl(result.user.username) });
      } else {
        setUser({ ...result.user, profileImageUrl: memberImageUrl(result.user.username) });
      }
      setNoteName(result.user.username);
      setPassword("");
      setConfirmation("");
      setScreen("feed");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await requestJson("/api/account/logout", { method: "POST" });
      setUser(null);
      setNoteName("");
      setPosts([]);
      setScreen("login");
    } catch (reason) {
      setError(reason.message);
    }
  }

  function openAccount(nextScreen) {
    setError("");
    setPassword("");
    setConfirmation("");
    setScreen(nextScreen);
  }

  async function publishPost(event) {
    event.preventDefault();
    try {
      await requestJson("/api/community/posts", { method: "POST", body: JSON.stringify({ text: postText, anonymous: postAnonymous }) });
      setPostText("");
      setPostAnonymous(false);
      await refreshFeed();
    } catch (reason) { setFeedError(reason.message); }
  }

  async function publishComment(event, postId) {
    event.preventDefault();
    const text = commentDrafts[postId] || "";
    try {
      await requestJson(`/api/community/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ text, anonymous: Boolean(commentAnonymous[postId]) }) });
      setCommentDrafts((items) => ({ ...items, [postId]: "" }));
      await refreshFeed();
    } catch (reason) { setFeedError(reason.message); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const { postId, commentId } = editing;
    const path = commentId
      ? `/api/community/posts/${postId}/comments/${commentId}`
      : `/api/community/posts/${postId}`;
    try {
      await requestJson(path, { method: "PATCH", body: JSON.stringify({ text: editText }) });
      setEditing(null);
      await refreshFeed();
    } catch (reason) { setFeedError(reason.message); }
  }

  async function deleteItem(postId, commentId) {
    if (!window.confirm(commentId ? "Delete this comment?" : "Delete this post and its comments?")) return;
    const path = commentId
      ? `/api/community/posts/${postId}/comments/${commentId}`
      : `/api/community/posts/${postId}`;
    try {
      await requestJson(path, { method: "DELETE" });
      await refreshFeed();
    } catch (reason) { setFeedError(reason.message); }
  }

  async function publishNote(event) {
    event.preventDefault();
    if (!window.confirm(user ? "Place this note at the selected position? Published notes cannot be edited or moved." : "Send this note to the host for review? If it is published, guests cannot delete it.")) return;
    setNoteBusy(true);
    setNoteError("");
    try {
      const result = await requestJson("/api/community/noteboard", { method: "POST", body: JSON.stringify({ text: noteText, displayName: noteName || "Guest", position: notePosition, showDate: showNoteDate }) });
      setNoteText("");
      if (result.submission) {
        setGuestSubmissions((current) => [...current, { id: result.submission.id, token: result.submission.token, text: noteText, displayName: noteName || "Guest", showDate: showNoteDate, state: "pending", reviewDeadline: result.submission.reviewDeadline }]);
        setSubmissionMessage("Your note is waiting for host review. It will be automatically approved after 10 minutes if the host does not decide.");
      } else {
        setNoteCooldownUntil(Date.parse(result.cooldownUntil));
        await refreshNoteboard();
      }
    } catch (reason) { setNoteError(reason.message); }
    finally { setNoteBusy(false); }
  }

  function chooseNotePosition(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1 - 0.22, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1 - 0.23, (event.clientY - bounds.top) / bounds.height));
    setNotePosition({ x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) });
  }

  async function replaceGuestNote(submission) {
    if (!window.confirm("Place your approved note at this position? The note will be published and cannot be moved.")) return;
    try {
      await requestJson("/api/community/noteboard/submission/position", { method: "POST", headers: { "X-Submission-Token": submission.token }, body: JSON.stringify({ position: notePosition }) });
      setGuestSubmissions((items) => items.filter((item) => item.id !== submission.id));
      setSubmissionMessage("Your note is on the board.");
      await refreshNoteboard();
    } catch (reason) { setNoteError(reason.message); }
  }

  async function removeNote(note) {
    if (!window.confirm("Delete your note from the board? This cannot be undone.")) return;
    try {
      await requestJson(`/api/community/noteboard/${note.id}`, { method: "DELETE" });
      await refreshNoteboard();
    } catch (reason) { setNoteError(reason.message); }
  }

  const replacementPreview = guestSubmissions.find((submission) => submission.state === "placement-required");

  if (screen !== "feed") {
    return <main className="guest-page entry-page">
      <section className="guest-card entry-card">
        <div className="entry-venue"><Avatar src={`${venueImageUrl}?v=${encodeURIComponent(venueName)}`} name={venueName} className="guest-mark entry-venue-avatar" /><p className="entry-venue-name">{venueName}</p></div>
        {checkingSession ? <><h1>Checking sign-in…</h1><p className="guest-message">Just a moment.</p></> : <>
          <h1>{screen === "register" ? "Create an account" : "Sign in to the community"}</h1>
          <form className="guest-account-form" onSubmit={submitAccount}>
            {screen === "register" && <div className="security-warning" role="note"><strong>Prototype security notice</strong><br />This app uses HTTP on the local network. Passwords and sign-in sessions are not encrypted in transit. Use a unique, disposable password that you don’t use anywhere else.</div>}
            <label htmlFor="guest-username">Username</label>
            <input id="guest-username" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" title="Use 3–24 letters, numbers, or underscores." value={username} onChange={(event) => setUsername(event.target.value)} required />
            {screen === "register" && <p className={`availability-message ${availability.includes("unavailable") ? "availability-error" : ""}`} aria-live="polite">{availability || "3–24 letters, numbers, or underscores. Usernames are unique on this venue’s host."}</p>}
            <label htmlFor="guest-password">Password</label>
            <input id="guest-password" type="password" autoComplete={screen === "register" ? "new-password" : "current-password"} minLength={screen === "register" ? 10 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
            {screen === "register" && <>
              <label htmlFor="guest-password-confirm">Confirm password</label>
              <input id="guest-password-confirm" type="password" autoComplete="new-password" minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              <p className="field-hint">Use at least 10 characters.</p>
            </>}
            {error && <p className="error-message" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Please wait…" : screen === "register" ? "Create account" : "Sign in"}</button>
          </form>
          <div className="guest-account-switch">
            <button className="text-button" type="button" onClick={() => openAccount(screen === "register" ? "login" : "register")}>{screen === "register" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
            <button className="text-button guest-continue" type="button" onClick={() => { setError(""); setScreen("feed"); }}>{screen === "register" ? "Continue as guest" : "Continue as guest"}</button>
          </div>
        </>}
      </section>
      <footer>Hosted locally by this venue</footer>
    </main>;
  }

  return (
    <main className="guest-page feed-page">
      <header className="feed-topbar"><div className="feed-brand"><Avatar src={`${venueImageUrl}?v=${encodeURIComponent(venueName)}`} name={venueName} className="guest-mark venue-avatar" /><div><p className="eyebrow">{venueName}</p><strong>{communityTab === "feed" ? "Community feed" : communityTab === "noteboard" ? "Noteboard" : "Community"}</strong></div></div><div className="feed-account">{user ? <details className="member-account-menu" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
        <summary className="member-menu-trigger"><Avatar src={user.profileImageUrl} name={user.username} /><span>Signed in as <strong>{user.username}</strong></span><span className="member-menu-chevron" aria-hidden="true">⌄</span></summary>
        <div className="member-menu-panel">
          <label className="member-menu-item file-button">Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPendingProfileImage(file); event.currentTarget.closest("details").open = false; event.target.value = ""; }} /></label>
          <button className="member-menu-item" type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; updateMemberImage(null); }}>Remove image</button>
          <button className="member-menu-item member-menu-signout" type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; signOut(); }}>Sign out</button>
        </div>
      </details> : <>Continuing as guest<button className="text-button" type="button" onClick={() => { setError(""); setScreen("login"); }}>Sign in</button></>}{profileImageError && <span className="error-message" role="alert">{profileImageError}</span>}</div></header>
      {pendingProfileImage && <ProfileImageCrop file={pendingProfileImage} onCancel={() => setPendingProfileImage(null)} onConfirm={updateMemberImage} busy={profileImageBusy} />}
      {enabledModules.length > 0 && <nav className="community-module-tabs" role="tablist" aria-label="Community modules">
        {enabledModules.includes("feed") && <button type="button" role="tab" aria-selected={communityTab === "feed"} className={communityTab === "feed" ? "module-tab module-tab-active" : "module-tab"} onClick={() => setCommunityTab("feed")}>Shared Feed</button>}
        {enabledModules.includes("noteboard") && <button type="button" role="tab" aria-selected={communityTab === "noteboard"} className={communityTab === "noteboard" ? "module-tab module-tab-active" : "module-tab"} onClick={() => setCommunityTab("noteboard")}>Noteboard</button>}
      </nav>}
      {enabledModules.length === 0 && <section className="community-feed community-unconfigured" role="status"><h2>No community is set up yet</h2><p>The host needs to create a community before guests can join.</p></section>}
      {enabledModules.includes("feed") && communityTab === "feed" && <section className="community-feed" aria-label="Community feed">
        <header className="feed-heading"><div><p className="eyebrow">AROUND THIS SPACE</p><h2>Community feed</h2></div><span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span></header>
        <form className="composer-card" onSubmit={publishPost}>
          <label htmlFor="new-post">Share something with the community</label>
          <textarea id="new-post" maxLength={2000} rows={3} value={postText} onChange={(event) => setPostText(event.target.value)} placeholder="Write a post…" required />
          <div className="composer-footer"><span>{postText.length}/2000</span>{user && <label className="toggle-label"><input type="checkbox" checked={postAnonymous} onChange={(event) => setPostAnonymous(event.target.checked)} /> Post anonymously</label>}<button className="primary-button" type="submit">Publish</button></div>
        </form>
        {feedError && <p className="error-message feed-error" role="alert">{feedError}</p>}
        {posts.length === 0 && !feedError && <div className="feed-empty"><span aria-hidden="true">✳</span><h3>It’s quiet here</h3><p>Start the conversation with a post.</p></div>}
        {posts.map((post) => <article className="post-card" key={post.id}>
          <div className="post-meta"><Avatar src={post.profileImageUrl} name={post.author} anonymous={post.anonymous} /><div><strong>{post.author}</strong><time>{new Date(post.createdAt).toLocaleString()}</time></div>{post.updatedAt && <span className="edited-label">Edited</span>}</div>
          {editing?.postId === post.id && !editing.commentId ? <form className="edit-form" onSubmit={saveEdit}><textarea maxLength={2000} value={editText} onChange={(event) => setEditText(event.target.value)} required /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" type="submit">Save</button></div></form> : <p className="post-text">{post.text}</p>}
          {post.canEdit && <div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id }); setEditText(post.text); }}>Edit</button><button type="button" onClick={() => deleteItem(post.id)}>Delete</button></div>}
          <div className="comments"><p className="comments-title">Comments <span>{post.comments.length}</span></p>
            {post.comments.map((comment) => <div className="comment" key={comment.id}><Avatar src={comment.profileImageUrl} name={comment.author} anonymous={comment.anonymous} /><div className="comment-body"><strong>{comment.author}</strong><p>{comment.text}</p>{comment.updatedAt && <small>Edited</small>}{comment.canEdit && <div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id, commentId: comment.id }); setEditText(comment.text); }}>Edit</button><button type="button" onClick={() => deleteItem(post.id, comment.id)}>Delete</button></div>}</div></div>)}
            <form className="comment-form" onSubmit={(event) => publishComment(event, post.id)}><input maxLength={2000} aria-label="Write a comment" placeholder={user ? "Add a comment…" : "Add an anonymous comment…"} value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts((items) => ({ ...items, [post.id]: event.target.value }))} required />{user && <label className="toggle-label compact-toggle"><input type="checkbox" checked={Boolean(commentAnonymous[post.id])} onChange={(event) => setCommentAnonymous((items) => ({ ...items, [post.id]: event.target.checked }))} /> Anonymous</label>}<button type="submit" aria-label="Publish comment">↗</button></form>
          </div>
        </article>)}
      </section>}
      {enabledModules.includes("noteboard") && communityTab === "noteboard" && <section className="community-feed noteboard-page" aria-label="Noteboard">
        <header className="feed-heading"><div><p className="eyebrow">LEAVE A LITTLE NOTE</p><h2>Community Noteboard</h2></div><span>{notes.length} {notes.length === 1 ? "note" : "notes"}</span></header>
        <p className="moderation-explainer">Choose a spot on the board. Notes can overlap, but placement is rejected if it would cover more than 30% of any note underneath. Placement is final.</p>
        <div className="noteboard-canvas" role="application" aria-label="Click to choose where to place a note" onClick={chooseNotePosition}>
          <div className="board-grid" aria-hidden="true" />
          {notes.map((note, index) => <article key={note.id} className="sticky-note" style={{ left: `${note.x * 100}%`, top: `${note.y * 100}%`, zIndex: notes.length - index }}>
            <small className="sticky-author">{note.displayName}</small><p>{note.text}</p>{note.showDate && <time>{new Date(note.createdAt).toLocaleDateString()}</time>}
            {note.canDelete && <button type="button" className="sticky-delete" onClick={(event) => { event.stopPropagation(); removeNote(note); }} disabled={currentTime < noteCooldownUntil} title={currentTime < noteCooldownUntil ? "Posting cooldown is active" : "Delete your note"}>×</button>}
          </article>)}
          {(noteText.trim() || replacementPreview) && <article className="sticky-note sticky-note-preview" style={{ left: `${notePosition.x * 100}%`, top: `${notePosition.y * 100}%` }}><small>{replacementPreview?.displayName ?? noteName}</small><p>{replacementPreview?.text || noteText}</p>{(replacementPreview?.showDate ?? showNoteDate) && <time>{new Date().toLocaleDateString()}</time>}</article>}
        </div>
        <p className="position-hint">Click anywhere on the board to choose the note’s top-left position. Selected: {Math.round(notePosition.x * 100)}%, {Math.round(notePosition.y * 100)}%</p>
        {guestSubmissions.length > 0 && <section className="submission-status-card" aria-live="polite"><h3>Your guest submissions</h3>{guestSubmissions.map((submission) => <div className="submission-status" key={submission.id}><strong>{submission.state === "placement-required" ? "Approved — choose a new position" : "Waiting for host review"}</strong><span>{submission.state === "placement-required" ? `Choose a valid spot before ${new Date(submission.placementDeadline).toLocaleTimeString()}.` : `Review deadline: ${new Date(submission.reviewDeadline).toLocaleTimeString()}`}</span>{submission.state === "placement-required" && <button className="secondary-button" type="button" onClick={() => replaceGuestNote(submission)}>Place at selected spot</button>}</div>)}</section>}
        {submissionMessage && <p className="success-message" role="status">{submissionMessage}</p>}
        <form className="composer-card note-composer" onSubmit={publishNote}>
          <label htmlFor="note-display-name">Display name</label>
          <input id="note-display-name" name="noteboard-display-name" type="text" autoComplete="off" autoCapitalize="words" autoCorrect="off" enterKeyHint="done" spellCheck={false} maxLength={32} value={noteName} onChange={(event) => setNoteName(event.currentTarget.value)} placeholder="Choose a name for this note" required />
          <label className="toggle-label date-toggle"><input type="checkbox" checked={showNoteDate} onChange={(event) => setShowNoteDate(event.target.checked)} /> Show date on this note</label>
          <label htmlFor="new-note">Your note</label>
          <textarea id="new-note" maxLength={500} rows={3} value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Write a short note…" required />
          <div className="composer-footer"><span>{noteText.length}/500</span><button className="primary-button" type="submit" disabled={noteBusy || (user && currentTime < noteCooldownUntil)}>{noteBusy ? "Placing…" : user && currentTime < noteCooldownUntil ? "Cooldown active" : user ? "Place note" : "Submit for review"}</button></div>
        </form>
        {user && currentTime < noteCooldownUntil && <p className="field-hint">You can post or delete a note after {new Date(noteCooldownUntil).toLocaleTimeString()}.</p>}
        {noteError && <p className="error-message feed-error" role="alert">{noteError}</p>}
      </section>}
      <footer>Hosted locally by this venue</footer>
    </main>
  );
}

function AdminLogin({ onAuthenticated }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      onAuthenticated();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-card auth-card">
        <div className="admin-login-brand"><img className="brand-mark" src={projectLogo} alt="" /><strong>Locomi</strong></div>
        <p className="eyebrow">HOST COMPUTER · LOCAL ADMIN</p>
        <h1>Admin sign in</h1>
        <p className="auth-description">Sign in on the host computer to manage local guest access.</p>
        <form onSubmit={submit} className="admin-form">
          <label htmlFor="owner-password">Owner password</label>
          <input
            id="owner-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>
        <p className="field-hint default-password-hint">Fresh installs use the default password <strong>locomi</strong>. You can change it after signing in.</p>
        <p className="local-only-note"><span aria-hidden="true">⌂</span> Admin controls are available only on this computer.</p>
      </section>
    </main>
  );
}

function AiProviderSettings() {
  const [settings, setSettings] = useState({ provider: "disabled", baseUrl: "", model: "", hasApiKey: false });
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { requestJson("/api/admin/ai-settings").then(setSettings).catch((reason) => setError(reason.message)); }, []);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const saved = await requestJson("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ ...settings, apiKey, keepExistingKey: !apiKey && settings.hasApiKey }) });
      setSettings(saved); setApiKey(""); setMessage("AI settings saved.");
    } catch (reason) { setError(reason.message); } finally { setBusy(false); }
  }
  return <section className="admin-card password-card"><p className="eyebrow">FEED MODERATION</p><h2>AI review provider</h2>
    <p className="card-copy">Choose local Ollama or an OpenAI-compatible provider. Cloud providers receive post and comment text. API keys are stored on this host.</p>
    <form className="admin-form password-form" onSubmit={save}>
      <label htmlFor="ai-provider">Provider</label><select id="ai-provider" value={settings.provider} onChange={(event) => setSettings({ ...settings, provider: event.target.value })}>
        <option value="disabled">Disabled</option><option value="ollama">Local Ollama</option><option value="openai-compatible">Cloud / OpenAI-compatible</option></select>
      {settings.provider !== "disabled" && <><label htmlFor="ai-url">API base URL</label><input id="ai-url" type="url" value={settings.baseUrl} onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })} required />
        <label htmlFor="ai-model">Model name</label><input id="ai-model" value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} required />
        {settings.provider === "openai-compatible" && <><label htmlFor="ai-key">API key {settings.hasApiKey && "(saved; leave blank to keep)"}</label><input id="ai-key" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} required={!settings.hasApiKey} /></>}</>}
      {error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
      <button className="secondary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save AI settings"}</button></form></section>;
}

function AdminFeedModeration() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");

  const refresh = useCallback(async () => {
    const data = await requestJson("/api/admin/moderation/feed");
    setPosts(data.posts);
  }, []);

  useEffect(() => {
    const loadFeed = () => refresh().catch((reason) => setError(reason.message)).finally(() => setLoading(false));
    const events = new EventSource("/api/community/events");
    events.onopen = loadFeed;
    events.addEventListener("feed-changed", loadFeed);
    return () => events.close();
  }, [refresh]);

  async function moderate(path, method, body) {
    try {
      await requestJson(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setEditing(null);
      await refresh();
      setError("");
    } catch (reason) { setError(reason.message); }
  }

  async function remove(postId, commentId) {
    if (!window.confirm(commentId ? "Delete this comment?" : "Delete this post and its comments?")) return;
    await moderate(commentId
      ? `/api/admin/moderation/posts/${postId}/comments/${commentId}`
      : `/api/admin/moderation/posts/${postId}`, "DELETE");
  }

  return <section className="community-feed host-moderation-feed" aria-label="Host moderation feed">
    <header className="feed-heading"><div><p className="eyebrow">PRIVATE HOST VIEW</p><h2>Community feed</h2></div><span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span></header>
    <p className="moderation-explainer">Signed-in usernames are visible here, including authors who posted anonymously to guests. Your owner session protects these controls.</p>
    {error && <p className="error-message feed-error" role="alert">{error}</p>}
    {loading && <div className="feed-empty" role="status">Loading community posts…</div>}
    {!loading && posts.length === 0 && !error && <div className="feed-empty"><span aria-hidden="true">✳</span><h3>It’s quiet here</h3><p>Posts and comments from guests will appear here.</p></div>}
    {!loading && posts.map((post) => <article className={`post-card moderation-post ${["flagged", "reviewed"].includes(post.aiReview?.status) ? "ai-flagged" : ""}`} key={post.id}>
      <div className="post-meta"><Avatar src={post.author !== "Anonymous guest" ? memberImageUrl(post.author) : null} name={post.author} /><div><div className="moderation-author"><strong>{post.author}</strong>{post.anonymous && post.author !== "Anonymous guest" && <span className="anonymity-badge">Anonymous to guests</span>}</div><time>{new Date(post.createdAt).toLocaleString()}</time></div>{post.updatedAt && <span className="edited-label">Edited</span>}</div>
      {editing?.postId === post.id && !editing.commentId ? <form className="edit-form" onSubmit={(event) => { event.preventDefault(); moderate(`/api/admin/moderation/posts/${post.id}`, "PATCH", { text: editText }); }}><textarea maxLength={2000} value={editText} onChange={(event) => setEditText(event.target.value)} required /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" type="submit">Save</button></div></form> : <p className="post-text">{post.text}</p>}
      <small>Post AI check: {post.aiReview?.status === "reviewed" ? "flagged · reviewed by host" : post.aiReview?.status || "not checked"}{post.aiReview?.severity && post.aiReview.severity !== "none" ? " · " + post.aiReview.severity.toUpperCase() : ""}{post.aiReview?.reason ? " · " + post.aiReview.reason : ""}</small>
      {post.aiReview?.status === "flagged" && <button type="button" onClick={() => moderate("/api/admin/moderation/posts/" + post.id + "/ai-reviewed", "POST")}>Mark post AI flag reviewed</button>}
      <div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id }); setEditText(post.text); }}>Edit post</button><button type="button" onClick={() => remove(post.id)}>Delete post</button></div>
      <div className="comments"><p className="comments-title">Comments <span>{post.comments.length}</span></p>
        {post.comments.map((comment) => <div className={`comment ${["flagged", "reviewed"].includes(comment.aiReview?.status) ? "ai-flagged" : ""}`} key={comment.id}>{["flagged", "reviewed"].includes(comment.aiReview?.status) && <strong className="ai-flag-banner">AI FLAGGED{comment.aiReview.status === "reviewed" ? " · REVIEWED" : " · HOST REVIEW"}</strong>}<Avatar src={comment.author !== "Anonymous guest" ? memberImageUrl(comment.author) : null} name={comment.author} /><div className="comment-body"><div className="moderation-author"><strong>{comment.author}</strong>{comment.anonymous && comment.author !== "Anonymous guest" && <span className="anonymity-badge">Anonymous to guests</span>}</div><time>{new Date(comment.createdAt).toLocaleString()}</time>{editing?.commentId === comment.id ? <form className="edit-form" onSubmit={(event) => { event.preventDefault(); moderate(`/api/admin/moderation/posts/${post.id}/comments/${comment.id}`, "PATCH", { text: editText }); }}><textarea maxLength={2000} value={editText} onChange={(event) => setEditText(event.target.value)} required /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" type="submit">Save</button></div></form> : <p>{comment.text}</p>}<small>Comment AI check: {comment.aiReview?.status === "reviewed" ? "flagged · reviewed by host" : comment.aiReview?.status || "not checked"}{comment.aiReview?.severity && comment.aiReview.severity !== "none" ? " · " + comment.aiReview.severity.toUpperCase() : ""}{comment.aiReview?.reason ? " · " + comment.aiReview.reason : ""}</small>{comment.aiReview?.status === "flagged" && <button type="button" onClick={() => moderate("/api/admin/moderation/posts/" + post.id + "/comments/" + comment.id + "/ai-reviewed", "POST")}>Mark comment reviewed</button>}{comment.updatedAt && <small>Edited</small>}<div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id, commentId: comment.id }); setEditText(comment.text); }}>Edit comment</button><button type="button" onClick={() => remove(post.id, comment.id)}>Delete comment</button></div></div></div>)}
      </div>
    </article>)}
  </section>;
}

function AccountFreezeList({ accounts, busyId, onToggle }) {
  if (!accounts.length) return <p className="field-hint">No community accounts have been created yet.</p>;
  return <div className="account-freeze-list">{accounts.map((account) => <div className="account-freeze-row" key={account.username}>
    <div className="account-identity"><Avatar src={account.profileImageUrl} name={account.username} /><strong>{account.username}</strong></div>
    {account.frozenUntil && <span>Frozen until {new Date(account.frozenUntil).toLocaleString()}</span>}
    <button className="text-button" type="button" disabled={busyId === account.username} onClick={() => onToggle(account)}>{account.frozenUntil ? "Unfreeze" : "Freeze 24 hours"}</button>
  </div>)}</div>;
}

function VenueProfileImageSettings({ venueName }) {
  const [imageUrl, setImageUrl] = useState("/api/profile-images/venue");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(file) {
    setBusy(true);
    setError("");
    try {
      if (file) {
        const response = await fetch("/api/admin/community/profile-image", { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Could not save the venue image.");
      } else await requestJson("/api/admin/community/profile-image", { method: "DELETE" });
      setImageUrl(`/api/profile-images/venue?v=${Date.now()}`);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  return <section className="admin-card profile-image-card"><div><p className="eyebrow">COMMUNITY IDENTITY</p><h2>Venue profile image</h2><p className="card-copy">Shown to visitors across the community. PNG, JPEG, or WebP, up to 2 MB.</p></div><Avatar src={imageUrl} name={venueName} className="venue-preview-avatar" /><label className="secondary-button file-button">Upload or replace<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => { update(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" className="text-button" onClick={() => update(null)} disabled={busy}>Remove image</button>{error && <p className="error-message" role="alert">{error}</p>}</section>;
}

function AdminAccountModeration() {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const refresh = useCallback(async () => {
    const result = await requestJson("/api/admin/moderation/accounts");
    setAccounts(result.accounts);
  }, []);

  useEffect(() => {
    const load = () => refresh().catch((reason) => setError(reason.message)).finally(() => setLoading(false));
    const events = new EventSource("/api/community/events");
    events.onopen = load;
    events.addEventListener("noteboard-changed", load);
    events.addEventListener("feed-changed", load);
    return () => events.close();
  }, [refresh]);

  async function toggleFreeze(account) {
    setBusyId(account.username);
    try {
      await requestJson(`/api/admin/moderation/accounts/${encodeURIComponent(account.username)}/${account.frozenUntil ? "unfreeze" : "freeze"}`, { method: "POST" });
      await refresh();
      setError("");
    } catch (reason) { setError(reason.message); }
    finally { setBusyId(""); }
  }

  return <section className="community-feed host-moderation-feed" aria-label="Host account moderation">
    <header className="feed-heading"><div><p className="eyebrow">GLOBAL MODERATION</p><h2>Accounts</h2></div><span>{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</span></header>
    <p className="moderation-explainer">Manage account freezes across the whole community. A freeze lasts 24 hours and blocks posting and note contributions. Guests have no persistent account to freeze.</p>
    {error && <p className="error-message feed-error" role="alert">{error}</p>}
    {loading ? <div className="feed-empty" role="status">Loading accounts…</div> : <section className="moderation-section"><h3>Community accounts</h3><AccountFreezeList accounts={accounts} busyId={busyId} onToggle={toggleFreeze} /></section>}
  </section>;
}

function AdminNoteboardModeration() {
  const [data, setData] = useState({ notes: [], submissions: [], audit: [], accounts: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [auditPassword, setAuditPassword] = useState("");

  const refresh = useCallback(async () => {
    const result = await requestJson("/api/admin/moderation/noteboard");
    setData(result);
  }, []);

  useEffect(() => {
    const load = () => refresh().catch((reason) => setError(reason.message)).finally(() => setLoading(false));
    const events = new EventSource("/api/community/events");
    events.onopen = load;
    events.addEventListener("noteboard-changed", load);
    return () => events.close();
  }, [refresh]);

  async function act(id, path, method = "POST", body) {
    setBusyId(id);
    try {
      await requestJson(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      await refresh();
      setError("");
    } catch (reason) { setError(reason.message); }
    finally { setBusyId(""); }
  }

  async function clearAudit(event) {
    event.preventDefault();
    if (!window.confirm("Clear the noteboard audit history? This does not delete notes.")) return;
    await act("audit", "/api/admin/moderation/noteboard/audit/clear", "POST", { password: auditPassword });
    setAuditPassword("");
  }

  return <section className="community-feed host-moderation-feed" aria-label="Host noteboard moderation">
    <header className="feed-heading"><div><p className="eyebrow">PRIVATE HOST VIEW</p><h2>Noteboard moderation</h2></div><span>{data.notes.length} published</span></header>
    <p className="moderation-explainer">Guest notes wait up to 10 minutes for review, then publish and are flagged for review. Approved notes that need a new position stay private until placed. Audit history is visible only here.</p>
    {error && <p className="error-message feed-error" role="alert">{error}</p>}
    {loading && <div className="feed-empty" role="status">Loading noteboard moderation…</div>}
    {!loading && <>
      <section className="moderation-section"><h3>Guest submissions</h3>
        {data.submissions.length === 0 && <p className="field-hint">No submissions are awaiting action.</p>}
        {data.submissions.map((submission) => <article className={`moderation-note-row ${["flagged", "reviewed"].includes(submission.aiReview?.status) ? "ai-flagged" : ""}`} key={submission.id}>
          <div>{["flagged", "reviewed"].includes(submission.aiReview?.status) && <strong className="ai-flag-banner">AI FLAGGED{submission.aiReview.status === "reviewed" ? " · REVIEWED" : " · HOST REVIEW"}</strong>}<div className="moderation-author"><strong>{submission.displayName}</strong><span className="anonymity-badge">{submission.author}</span></div><p>{submission.text}</p><small>AI check: {submission.aiReview?.status === "reviewed" ? "flagged · reviewed by host" : submission.aiReview?.status || "not checked"}{submission.aiReview?.severity && submission.aiReview.severity !== "none" ? " · " + submission.aiReview.severity.toUpperCase() : ""}{submission.aiReview?.reason ? " · " + submission.aiReview.reason : ""}</small><small>{submission.state === "pending" ? `Review by ${new Date(submission.reviewDeadline).toLocaleString()}` : `Choose a valid position by ${new Date(submission.placementDeadline).toLocaleString()}`}</small>{submission.aiReview?.status === "flagged" && <button type="button" onClick={() => act(submission.id, `/api/admin/moderation/noteboard/submissions/${submission.id}/ai-reviewed`)}>Mark AI flag reviewed</button>}</div>
          {submission.state === "pending" && <div className="item-actions"><button type="button" disabled={busyId === submission.id} onClick={() => act(submission.id, `/api/admin/moderation/noteboard/submissions/${submission.id}/approve`)}>Approve</button><button type="button" disabled={busyId === submission.id} onClick={() => act(submission.id, `/api/admin/moderation/noteboard/submissions/${submission.id}/reject`)}>Reject</button></div>}
        </article>)}
      </section>
      <section className="moderation-section"><h3>Published notes</h3>
        {data.notes.length === 0 && <p className="field-hint">No notes are on the board.</p>}
        {data.notes.map((note) => <article className={`moderation-note-row ${["flagged", "reviewed"].includes(note.aiReview?.status) ? "ai-flagged" : ""}`} key={note.id}>
          <div>{["flagged", "reviewed"].includes(note.aiReview?.status) && <strong className="ai-flag-banner">AI FLAGGED{note.aiReview.status === "reviewed" ? " · REVIEWED" : " · HOST REVIEW"}</strong>}<div className="moderation-author"><strong>{note.displayName}</strong><span className="anonymity-badge">Host identity: {note.author}</span>{note.needsReview && <span className="review-badge">Needs review</span>}</div><p>{note.text}</p><small>AI check: {note.aiReview?.status === "reviewed" ? "flagged · reviewed by host" : note.aiReview?.status || "not checked"}{note.aiReview?.severity && note.aiReview.severity !== "none" ? " · " + note.aiReview.severity.toUpperCase() : ""}{note.aiReview?.reason ? " · " + note.aiReview.reason : ""}</small><small>{new Date(note.createdAt).toLocaleString()} · Position {Math.round(note.x * 100)}%, {Math.round(note.y * 100)}%</small>{note.aiReview?.status === "flagged" && <button type="button" onClick={() => act(note.id, `/api/admin/moderation/noteboard/notes/${note.id}/ai-reviewed`)}>Mark AI flag reviewed</button>}</div>
          <div className="item-actions">{note.needsReview && <button type="button" disabled={busyId === note.id} onClick={() => act(note.id, `/api/admin/moderation/noteboard/notes/${note.id}/reviewed`)}>Mark reviewed</button>}<button type="button" disabled={busyId === note.id} onClick={() => { if (window.confirm("Remove this note from the board?")) act(note.id, `/api/admin/moderation/noteboard/notes/${note.id}`, "DELETE"); }}>Remove</button></div>
        </article>)}
      </section>
      <section className="moderation-section"><h3>Global account freezes</h3><p className="field-hint">A freeze lasts 24 hours and blocks contribution across the feed and Noteboard. Guests have no persistent account to freeze.</p>
        <AccountFreezeList accounts={data.accounts} busyId={busyId} onToggle={(account) => act(account.username, `/api/admin/moderation/accounts/${encodeURIComponent(account.username)}/${account.frozenUntil ? "unfreeze" : "freeze"}`)} />
      </section>
      <details className="audit-dropdown">
        <summary>Recent note history <span>{data.audit.length} entries</span></summary>
        <div className="audit-dropdown-content">
          <p className="field-hint">Keeps up to 500 events or 30 days. Deleted note text remains here until pruned or cleared.</p>
          {data.audit.length === 0 && <p className="field-hint">No history entries.</p>}
          {data.audit.map((entry) => <article className="audit-row" key={entry.id}><div><strong>{entry.action.replaceAll("-", " ")}</strong><span>{entry.author}{entry.displayName ? ` · displayed as ${entry.displayName}` : ""}</span><time>{new Date(entry.createdAt).toLocaleString()}</time><p>{entry.text}</p></div></article>)}
          <form className="audit-clear-form" onSubmit={clearAudit}><label htmlFor="audit-password">Admin password to clear history</label><input id="audit-password" type="password" autoComplete="current-password" value={auditPassword} onChange={(event) => setAuditPassword(event.target.value)} required /><button className="secondary-button" type="submit" disabled={busyId === "audit"}>Clear history</button></form>
        </div>
      </details>
    </>}
  </section>;
}

function AdminModeration() {
  const [moduleTab, setModuleTab] = useState("feed");
  return <>
    <div className="admin-tabs module-admin-tabs" role="tablist" aria-label="Community moderation modules">
      <button className={`admin-tab ${moduleTab === "feed" ? "admin-tab-active" : ""}`} type="button" role="tab" aria-selected={moduleTab === "feed"} onClick={() => setModuleTab("feed")}>Feed</button>
      <button className={`admin-tab ${moduleTab === "noteboard" ? "admin-tab-active" : ""}`} type="button" role="tab" aria-selected={moduleTab === "noteboard"} onClick={() => setModuleTab("noteboard")}>Noteboard</button>
      <button className={`admin-tab ${moduleTab === "accounts" ? "admin-tab-active" : ""}`} type="button" role="tab" aria-selected={moduleTab === "accounts"} onClick={() => setModuleTab("accounts")}>Accounts</button>
    </div>
    {moduleTab === "feed" ? <AdminFeedModeration /> : moduleTab === "noteboard" ? <AdminNoteboardModeration /> : <AdminAccountModeration />}
  </>;
}

function AdminDashboard({ initialStatus, onLogout }) {
  const [status, setStatus] = useState(initialStatus);
  const [community, setCommunity] = useState(null);
  const [communityLoaded, setCommunityLoaded] = useState(!initialStatus.communityExists);
  const [communityPrompt, setCommunityPrompt] = useState(null);
  const [communityDraft, setCommunityDraft] = useState({ venueType: "Cafe", customVenueType: "", venueName: "", enabledModules: ["feed", "noteboard"] });
  const [communityStep, setCommunityStep] = useState(0);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [communityError, setCommunityError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [continueHostingAfterCreate, setContinueHostingAfterCreate] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialStatus.interfaces[0]?.address || "");
  const [join, setJoin] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyState, setCopyState] = useState("Copy link");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("hosting");
  const adminTabs = [
    { id: "hosting", label: "Hosting" },
    { id: "community", label: "Community" },
    { id: "security", label: "Security" },
  ];

  const refreshStatus = useCallback(async () => {
    const nextStatus = await requestJson("/api/admin/status");
    setStatus(nextStatus);
    setSelectedAddress((current) => nextStatus.interfaces.some((item) => item.address === current)
      ? current
      : nextStatus.interfaces[0]?.address || "");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => refreshStatus().catch((reason) => setError(reason.message)), 5000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  useEffect(() => {
    let active = true;
    if (!status.communityExists) {
      setCommunity(null);
      setCommunityLoaded(true);
      return undefined;
    }
    setCommunityLoaded(false);
    requestJson("/api/admin/community")
      .then(({ community: saved }) => { if (active) { setCommunity(saved); setCommunityLoaded(true); } })
      .catch((reason) => { if (active) { setCommunityError(reason.message); setCommunityLoaded(true); } });
    return () => { active = false; };
  }, [status.communityExists]);

  useEffect(() => {
    let active = true;
    if (!status.hostingEnabled || !selectedAddress) {
      setJoin(null);
      return undefined;
    }
    requestJson(`/api/admin/join?address=${encodeURIComponent(selectedAddress)}`)
      .then((payload) => { if (active) setJoin(payload); })
      .catch((reason) => { if (active) { setJoin(null); setError(reason.message); } });
    return () => { active = false; };
  }, [status.hostingEnabled, selectedAddress, status.port]);

  async function setHosting(enabled) {
    if (enabled && !status.communityExists) {
      openCommunityPrompt("create", true);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await requestJson("/api/admin/hosting", { method: "POST", body: JSON.stringify({ enabled }) });
      await refreshStatus();
    } catch (reason) {
      setError(reason.message);
      await refreshStatus().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  function openCommunityPrompt(mode, continueHosting = false) {
    setCommunityError("");
    setCommunityStep(0);
    setContinueHostingAfterCreate(continueHosting);
    setCommunityDraft(community ? { ...community, enabledModules: [...community.enabledModules] } : {
      venueType: "Cafe", customVenueType: "", venueName: "", enabledModules: ["feed", "noteboard"],
    });
    setCommunityPrompt(mode);
  }

  function closeCommunityPrompt() {
    if (communityBusy) return;
    setCommunityPrompt(null);
    setCommunityError("");
    setDeletePassword("");
    setContinueHostingAfterCreate(false);
  }

  function toggleModule(module) {
    setCommunityDraft((current) => ({
      ...current,
      enabledModules: current.enabledModules.includes(module)
        ? current.enabledModules.filter((item) => item !== module)
        : [...current.enabledModules, module],
    }));
  }

  async function saveCommunity(event) {
    event.preventDefault();
    if (communityStep < 2) {
      setCommunityStep((step) => step + 1);
      return;
    }
    setCommunityBusy(true);
    setCommunityError("");
    try {
      const mode = communityPrompt;
      const { community: saved } = await requestJson("/api/admin/community", {
        method: mode === "create" ? "POST" : "PATCH",
        body: JSON.stringify(communityDraft),
      });
      setCommunity(saved);
      setStatus((current) => ({ ...current, communityExists: true }));
      setCommunityPrompt(null);
      if (continueHostingAfterCreate) {
        setContinueHostingAfterCreate(false);
        try {
          await requestJson("/api/admin/hosting", { method: "POST", body: JSON.stringify({ enabled: true }) });
          await refreshStatus();
        } catch (reason) {
          setError(reason.message);
          await refreshStatus().catch(() => {});
        }
      }
    } catch (reason) {
      setCommunityError(reason.message);
    } finally {
      setCommunityBusy(false);
    }
  }

  async function deleteCommunity(event) {
    event.preventDefault();
    setCommunityBusy(true);
    setCommunityError("");
    try {
      await requestJson("/api/admin/community", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      setCommunity(null);
      setStatus((current) => ({ ...current, communityExists: false }));
      setCommunityPrompt(null);
      setDeletePassword("");
      await refreshStatus();
    } catch (reason) {
      setCommunityError(reason.message);
    } finally {
      setCommunityBusy(false);
    }
  }

  async function copyLink() {
    if (!join?.url) return;
    try {
      await navigator.clipboard.writeText(join.url);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy link"), 1800);
    } catch {
      setCopyState("Select and copy the link");
    }
  }

  async function logout() {
    try {
      await requestJson("/api/admin/logout", { method: "POST" });
      onLogout();
    } catch (reason) {
      setError(reason.message);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("The passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      await requestJson("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed. Use it the next time you sign in.");
    } catch (reason) {
      setPasswordError(reason.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  function moveTab(event) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const current = adminTabs.findIndex(({ id }) => id === activeTab);
    const next = adminTabs[(current + delta + adminTabs.length) % adminTabs.length];
    setActiveTab(next.id);
    document.getElementById(`host-tab-${next.id}`)?.focus();
  }

  return (
    <main className="admin-page dashboard-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img className="brand-mark" src={projectLogo} alt="Locomi logo" />
          <div><p className="eyebrow">LOCOMI</p><p className="brand-subtitle">Host controls</p></div>
        </div>
        <div className="admin-tabs host-primary-tabs" role="tablist" aria-label="Host controls" onKeyDown={moveTab}>
          {adminTabs.map(({ id, label }) => <button key={id} id={`host-tab-${id}`} className={`admin-tab ${activeTab === id ? "admin-tab-active" : ""}`} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`host-panel-${id}`} tabIndex={activeTab === id ? 0 : -1} onClick={() => setActiveTab(id)}>{label}</button>)}
        </div>
        <div className="admin-header-actions">
          <span className="host-status"><i className={status.hostingEnabled ? "is-on" : ""} />{status.hostingEnabled ? "Guest hosting is on" : "Guest hosting is off"}</span>
          <button className="quiet-button" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      {activeTab === "hosting" && <section className="dashboard-intro">
        <p className="eyebrow">VENUE HOST</p>
        <h1>Your space, on your network.</h1>
        <p>Turn on guest access when you’re ready. Your admin screen stays available on this computer either way.</p>
      </section>}

      {activeTab === "hosting" && <section id="host-panel-hosting" className="admin-tab-panel" role="tabpanel" aria-labelledby="host-tab-hosting" tabIndex={0}>
      <div className={`admin-grid hosting-overview-grid ${status.hostingEnabled ? "hosting-open" : "hosting-closed"}`}>
        <section className="admin-card hosting-card">
          <div className="card-heading">
            <div><p className="eyebrow">GUEST ACCESS</p><h2>{status.hostingEnabled ? "Your community is open" : "Your community is private"}</h2></div>
            <span className={`status-icon ${status.hostingEnabled ? "status-icon-on" : ""}`} aria-hidden="true">{status.hostingEnabled ? "✓" : "○"}</span>
          </div>
          <p className="card-copy">{status.hostingEnabled
            ? "People connected to the venue Wi-Fi can open the welcome screen."
            : "Guests can’t connect over Wi-Fi until you enable hosting."}</p>
          {status.interfaces.length > 1 && (
            <label className="address-label" htmlFor="network-address">Venue network</label>
          )}
          {status.interfaces.length > 1 && (
            <select id="network-address" value={selectedAddress} onChange={(event) => setSelectedAddress(event.target.value)}>
              {status.interfaces.map((item) => <option key={item.address} value={item.address}>{item.name} · {item.address}</option>)}
            </select>
          )}
          {status.interfaces.length === 0 && <p className="empty-note">Connect this computer to the venue Wi-Fi before enabling guest access.</p>}
          <button className={`primary-button ${status.hostingEnabled ? "stop-button" : ""}`} type="button" disabled={busy || (!status.hostingEnabled && status.communityExists && status.interfaces.length === 0)} onClick={() => setHosting(!status.hostingEnabled)}>
            {busy ? "Updating…" : status.hostingEnabled ? "Disable guest hosting" : "Enable guest hosting"}
          </button>
          <section className="community-setup-summary" aria-label="Venue community setup">
            <div>
              <p className="eyebrow">COMMUNITY SETUP</p>
              {status.communityExists
                ? communityLoaded
                  ? <><h3>{community?.venueName || "Community"}</h3><p className="community-summary-copy">{community?.venueType === "Other" ? community.customVenueType : community?.venueType} · {community?.enabledModules?.map((module) => module === "feed" ? "Shared Feed" : "Noteboard").join(", ")}</p></>
                  : <p className="community-summary-copy">Loading community details…</p>
                : <p className="community-summary-copy">Create a community to set up this venue and choose its features.</p>}
            </div>
            {status.communityExists
              ? <div className="community-management-actions"><button className="secondary-button" type="button" onClick={() => openCommunityPrompt("edit")} disabled={communityBusy || !communityLoaded}>Edit</button><button className="danger-button" type="button" onClick={() => { setCommunityError(""); setDeletePassword(""); setCommunityPrompt("delete"); }} disabled={communityBusy}>Delete</button></div>
              : <button className="secondary-button" type="button" onClick={() => openCommunityPrompt("create")} disabled={communityBusy}>Create community</button>}
          </section>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="hosting-footnote">Hosting resets to off whenever this app restarts.</div>
        </section>
        {status.hostingEnabled && <section className="admin-card join-panel">
          <div className="card-heading">
            <div><p className="eyebrow">SHARE WITH GUESTS</p><h2>Scan to open</h2></div>
            <span className="wifi-icon" aria-hidden="true">⌁</span>
          </div>
          {join ? <>
            <div className="qr-frame"><img src={join.qrDataUrl} alt="QR code for the guest community" /></div>
            <p className="scan-hint">Guests must be connected to the venue Wi-Fi</p>
            <div className="link-row"><code>{join.url}</code><button className="copy-button" type="button" onClick={copyLink}>{copyState}</button></div>
            <a className="secondary-button qr-download-button" href={join.qrDataUrl} download="community-qr-code.png">Save QR code</a>
          </> : <div className="empty-state" role="status">Preparing the current guest link…</div>}
        </section>}
      </div>
      <aside className="notice"><span className="notice-icon" aria-hidden="true">i</span><p><strong>Connection depends on your venue network.</strong> A firewall or Wi-Fi client isolation can block guest devices. Network access confirms reachability, not physical presence.</p></aside>
      </section>}

      {activeTab === "community" && <section id="host-panel-community" className="admin-tab-panel" role="tabpanel" aria-labelledby="host-tab-community" tabIndex={0}>
      <div className={`admin-grid community-settings-grid ${status.communityExists && communityLoaded ? "community-settings-ready" : "community-settings-empty"}`}>
        {status.communityExists && communityLoaded && <VenueProfileImageSettings venueName={community?.venueName || "Community"} />}
        <section className="admin-card host-community-card"><div><p className="eyebrow">HOST PARTICIPATION</p><h2>Join the community feed</h2><p className="card-copy">To publish publicly, open the shared feed and sign in with a regular community account. Admin credentials stay private.</p></div><a className="secondary-button" href="/" target="_blank" rel="noreferrer">Open community feed ↗</a></section>
      </div>
      <AdminModeration />
      </section>}

      {activeTab === "security" && <section id="host-panel-security" className="admin-tab-panel" role="tabpanel" aria-labelledby="host-tab-security" tabIndex={0}>
      <div className="admin-grid security-settings-grid">
      <section className="admin-card password-card">
        <p className="eyebrow">OWNER SECURITY</p>
        <h2>Change admin password</h2>
        <p className="card-copy">Choose at least 10 characters. Your password is stored as a salted hash on this host.</p>
        <form className="admin-form password-form" onSubmit={changePassword}>
          <label htmlFor="new-owner-password">New password</label>
          <input id="new-owner-password" type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <label htmlFor="confirm-owner-password">Confirm new password</label>
          <input id="confirm-owner-password" type="password" autoComplete="new-password" minLength={10} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          {passwordError && <p className="error-message" role="alert">{passwordError}</p>}
          {passwordMessage && <p className="success-message" role="status">{passwordMessage}</p>}
          <button className="secondary-button" type="submit" disabled={passwordBusy}>{passwordBusy ? "Saving…" : "Change password"}</button>
        </form>
      </section>
      <AiProviderSettings />
      </div>
      </section>}

      {communityPrompt && <div className="community-modal-backdrop" role="presentation">
        <section className="community-modal" role="dialog" aria-modal="true" aria-labelledby="community-modal-title">
          <header className="community-modal-header">
            <div><p className="eyebrow">VENUE COMMUNITY</p><h2 id="community-modal-title">{communityPrompt === "create" ? "Create your community" : communityPrompt === "edit" ? "Edit your community" : "Delete your community"}</h2></div>
            <button className="modal-close-button" type="button" aria-label="Close" onClick={closeCommunityPrompt} disabled={communityBusy}>×</button>
          </header>

          {communityPrompt === "delete" ? status.hostingEnabled ? <div className="community-delete-blocked">
            <p className="error-message" role="alert">Turn off guest hosting before deleting this community. Use the hosting control, then try again.</p>
            <button className="secondary-button" type="button" onClick={closeCommunityPrompt}>Close</button>
          </div> : <form className="community-prompt-form" onSubmit={deleteCommunity}>
            <p className="community-prompt-copy">This permanently deletes the venue settings, posts, notes, community accounts, and moderation history. Your owner login remains available.</p>
            <label htmlFor="delete-community-password">Enter the current owner password to confirm</label>
            <input id="delete-community-password" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required />
            {communityError && <p className="error-message" role="alert">{communityError}</p>}
            <div className="community-modal-actions"><button className="secondary-button" type="button" onClick={closeCommunityPrompt} disabled={communityBusy}>Cancel</button><button className="danger-button" type="submit" disabled={communityBusy || !deletePassword}>{communityBusy ? "Deleting…" : "Delete community"}</button></div>
          </form> : <form className="community-prompt-form" onSubmit={saveCommunity}>
            <p className="community-step-label">Step {communityStep + 1} of 3</p>
            {communityStep === 0 && <>
              <label htmlFor="community-venue-type">Venue type</label>
              <select id="community-venue-type" value={communityDraft.venueType} onChange={(event) => setCommunityDraft((current) => ({ ...current, venueType: event.target.value }))}>
                <option value="Cafe">Cafe</option><option value="Other">Other</option>
              </select>
              {communityDraft.venueType === "Other" && <><label htmlFor="community-custom-type">Custom venue type</label><input id="community-custom-type" type="text" maxLength={60} value={communityDraft.customVenueType} onChange={(event) => setCommunityDraft((current) => ({ ...current, customVenueType: event.target.value }))} placeholder="For example, bookstore" required /></>}
            </>}
            {communityStep === 1 && <>
              <label htmlFor="community-venue-name">Venue name</label>
              <input id="community-venue-name" type="text" maxLength={80} value={communityDraft.venueName} onChange={(event) => setCommunityDraft((current) => ({ ...current, venueName: event.target.value }))} placeholder="Enter your venue name" required />
            </>}
            {communityStep === 2 && <fieldset className="community-module-checklist">
              <legend>Feature modules</legend>
              <label><input type="checkbox" checked={communityDraft.enabledModules.includes("feed")} disabled={communityDraft.enabledModules.length === 1 && communityDraft.enabledModules.includes("feed")} onChange={() => toggleModule("feed")} /> Shared Feed</label>
              <label><input type="checkbox" checked={communityDraft.enabledModules.includes("noteboard")} disabled={communityDraft.enabledModules.length === 1 && communityDraft.enabledModules.includes("noteboard")} onChange={() => toggleModule("noteboard")} /> Noteboard</label>
              <p className="field-hint">Choose at least one feature.</p>
            </fieldset>}
            {communityError && <p className="error-message" role="alert">{communityError}</p>}
            <div className="community-modal-actions">
              <button className="secondary-button" type="button" onClick={communityStep === 0 ? closeCommunityPrompt : () => setCommunityStep((step) => step - 1)} disabled={communityBusy}>{communityStep === 0 ? "Cancel" : "Back"}</button>
              <button className="primary-button" type="submit" disabled={communityBusy || (communityStep === 2 && communityDraft.enabledModules.length === 0)}>{communityBusy ? "Saving…" : communityStep === 2 ? communityPrompt === "create" ? "Create community" : "Save changes" : "Continue"}</button>
            </div>
          </form>}
        </section>
      </div>}
    </main>
  );
}

function Admin() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const nextStatus = await requestJson("/api/admin/status");
      setStatus(nextStatus);
      setError("");
    } catch (reason) {
      setError(reason.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!status) {
    return <main className="admin-page"><section className="admin-card auth-card"><p className="eyebrow">LOCAL ADMIN</p><h1>Opening host controls…</h1>{error && <p className="error-message" role="alert">{error}</p>}</section></main>;
  }
  if (!status.authenticated) return <AdminLogin onAuthenticated={refresh} />;
  return <AdminDashboard initialStatus={status} onLogout={refresh} />;
}

export default function App() {
  return window.location.pathname.startsWith("/guest") ? <GuestWelcome /> : <Admin />;
}

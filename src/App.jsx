import { useCallback, useEffect, useState } from "react";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
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

  useEffect(() => {
    let active = true;
    requestJson("/api/account/session")
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        if (result.user) setScreen("feed");
      })
      .catch(() => {})
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  const refreshFeed = useCallback(async () => {
    try {
      const result = await requestJson("/api/community/feed");
      setPosts(result.posts);
      setFeedError("");
    } catch (reason) {
      setFeedError(reason.message);
    }
  }, []);

  useEffect(() => {
    if (screen !== "feed") return undefined;
    const events = new EventSource("/api/community/events");
    events.onopen = refreshFeed;
    events.addEventListener("feed-changed", refreshFeed);
    return () => events.close();
  }, [screen, refreshFeed]);

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
        setUser(result.user);
      } else {
        setUser(result.user);
      }
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

  if (screen !== "feed") {
    return <main className="guest-page entry-page">
      <section className="guest-card entry-card">
        <div className="guest-mark" aria-hidden="true">LC</div>
        <p className="eyebrow">LOCAL COMMUNITY</p>
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
      <header className="feed-topbar"><div className="feed-brand"><div className="guest-mark" aria-hidden="true">LC</div><div><p className="eyebrow">LOCAL COMMUNITY</p><strong>Community feed</strong></div></div><div className="feed-account" role="status">{user ? <>Signed in as <strong>{user.username}</strong><button className="text-button" type="button" onClick={signOut}>Sign out</button></> : <>Continuing as guest<button className="text-button" type="button" onClick={() => { setError(""); setScreen("login"); }}>Sign in</button></>}</div></header>
      <section className="community-feed" aria-label="Community feed">
        <header className="feed-heading"><div><p className="eyebrow">AROUND THIS SPACE</p><h2>Community feed</h2></div><span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span></header>
        <form className="composer-card" onSubmit={publishPost}>
          <label htmlFor="new-post">Share something with the community</label>
          <textarea id="new-post" maxLength={2000} rows={3} value={postText} onChange={(event) => setPostText(event.target.value)} placeholder="Write a post…" required />
          <div className="composer-footer"><span>{postText.length}/2000</span>{user && <label className="toggle-label"><input type="checkbox" checked={postAnonymous} onChange={(event) => setPostAnonymous(event.target.checked)} /> Post anonymously</label>}<button className="primary-button" type="submit">Publish</button></div>
        </form>
        {feedError && <p className="error-message feed-error" role="alert">{feedError}</p>}
        {posts.length === 0 && !feedError && <div className="feed-empty"><span aria-hidden="true">✳</span><h3>It’s quiet here</h3><p>Start the conversation with a post.</p></div>}
        {posts.map((post) => <article className="post-card" key={post.id}>
          <div className="post-meta"><div className="avatar-dot" aria-hidden="true">{post.anonymous ? "A" : post.author.slice(0, 1).toUpperCase()}</div><div><strong>{post.author}</strong><time>{new Date(post.createdAt).toLocaleString()}</time></div>{post.updatedAt && <span className="edited-label">Edited</span>}</div>
          {editing?.postId === post.id && !editing.commentId ? <form className="edit-form" onSubmit={saveEdit}><textarea maxLength={2000} value={editText} onChange={(event) => setEditText(event.target.value)} required /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" type="submit">Save</button></div></form> : <p className="post-text">{post.text}</p>}
          {post.canEdit && <div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id }); setEditText(post.text); }}>Edit</button><button type="button" onClick={() => deleteItem(post.id)}>Delete</button></div>}
          <div className="comments"><p className="comments-title">Comments <span>{post.comments.length}</span></p>
            {post.comments.map((comment) => <div className="comment" key={comment.id}><div className="comment-body"><strong>{comment.author}</strong><p>{comment.text}</p>{comment.updatedAt && <small>Edited</small>}{comment.canEdit && <div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id, commentId: comment.id }); setEditText(comment.text); }}>Edit</button><button type="button" onClick={() => deleteItem(post.id, comment.id)}>Delete</button></div>}</div></div>)}
            <form className="comment-form" onSubmit={(event) => publishComment(event, post.id)}><input maxLength={2000} aria-label="Write a comment" placeholder={user ? "Add a comment…" : "Add an anonymous comment…"} value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts((items) => ({ ...items, [post.id]: event.target.value }))} required />{user && <label className="toggle-label compact-toggle"><input type="checkbox" checked={Boolean(commentAnonymous[post.id])} onChange={(event) => setCommentAnonymous((items) => ({ ...items, [post.id]: event.target.checked }))} /> Anonymous</label>}<button type="submit" aria-label="Publish comment">↗</button></form>
          </div>
        </article>)}
      </section>
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
        <div className="brand-mark" aria-hidden="true">LC</div>
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

function AdminModeration() {
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
    {!loading && posts.map((post) => <article className="post-card moderation-post" key={post.id}>
      <div className="post-meta"><div className="avatar-dot" aria-hidden="true">{post.author === "Anonymous guest" ? "A" : post.author.slice(0, 1).toUpperCase()}</div><div><div className="moderation-author"><strong>{post.author}</strong>{post.anonymous && post.author !== "Anonymous guest" && <span className="anonymity-badge">Anonymous to guests</span>}</div><time>{new Date(post.createdAt).toLocaleString()}</time></div>{post.updatedAt && <span className="edited-label">Edited</span>}</div>
      {editing?.postId === post.id && !editing.commentId ? <form className="edit-form" onSubmit={(event) => { event.preventDefault(); moderate(`/api/admin/moderation/posts/${post.id}`, "PATCH", { text: editText }); }}><textarea maxLength={2000} value={editText} onChange={(event) => setEditText(event.target.value)} required /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" type="submit">Save</button></div></form> : <p className="post-text">{post.text}</p>}
      <div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id }); setEditText(post.text); }}>Edit post</button><button type="button" onClick={() => remove(post.id)}>Delete post</button></div>
      <div className="comments"><p className="comments-title">Comments <span>{post.comments.length}</span></p>
        {post.comments.map((comment) => <div className="comment" key={comment.id}><div className="comment-body"><div className="moderation-author"><strong>{comment.author}</strong>{comment.anonymous && comment.author !== "Anonymous guest" && <span className="anonymity-badge">Anonymous to guests</span>}</div><time>{new Date(comment.createdAt).toLocaleString()}</time>{editing?.commentId === comment.id ? <form className="edit-form" onSubmit={(event) => { event.preventDefault(); moderate(`/api/admin/moderation/posts/${post.id}/comments/${comment.id}`, "PATCH", { text: editText }); }}><textarea maxLength={2000} value={editText} onChange={(event) => setEditText(event.target.value)} required /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" type="submit">Save</button></div></form> : <p>{comment.text}</p>}{comment.updatedAt && <small>Edited</small>}<div className="item-actions"><button type="button" onClick={() => { setEditing({ postId: post.id, commentId: comment.id }); setEditText(comment.text); }}>Edit comment</button><button type="button" onClick={() => remove(post.id, comment.id)}>Delete comment</button></div></div></div>)}
      </div>
    </article>)}
  </section>;
}

function AdminDashboard({ initialStatus, onLogout }) {
  const [status, setStatus] = useState(initialStatus);
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
        <div className="brand-mark" aria-hidden="true">LC</div>
        <div><p className="eyebrow">LOCAL COMMUNITY</p><p className="brand-subtitle">Host controls</p></div>
        <span className="host-status"><i className={status.hostingEnabled ? "is-on" : ""} />{status.hostingEnabled ? "Guest hosting is on" : "Guest hosting is off"}</span>
        <button className="quiet-button" type="button" onClick={logout}>Sign out</button>
      </header>

      <section className="dashboard-intro">
        <p className="eyebrow">VENUE HOST</p>
        <h1>Your space, on your network.</h1>
        <p>Turn on guest access when you’re ready. Your admin screen stays available on this computer either way.</p>
      </section>

      <div className="admin-tabs" role="tablist" aria-label="Host controls" onKeyDown={moveTab}>
        {adminTabs.map(({ id, label }) => <button key={id} id={`host-tab-${id}`} className={`admin-tab ${activeTab === id ? "admin-tab-active" : ""}`} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`host-panel-${id}`} tabIndex={activeTab === id ? 0 : -1} onClick={() => setActiveTab(id)}>{label}</button>)}
      </div>

      {activeTab === "hosting" && <section id="host-panel-hosting" className="admin-tab-panel" role="tabpanel" aria-labelledby="host-tab-hosting" tabIndex={0}>
      <div className="admin-grid">
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
          <button className={`primary-button ${status.hostingEnabled ? "stop-button" : ""}`} type="button" disabled={busy || (!status.hostingEnabled && status.interfaces.length === 0)} onClick={() => setHosting(!status.hostingEnabled)}>
            {busy ? "Updating…" : status.hostingEnabled ? "Disable guest hosting" : "Enable guest hosting"}
          </button>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="hosting-footnote">Hosting resets to off whenever this app restarts.</div>
        </section>
      </div>
      {status.hostingEnabled && (
        <section className="admin-card join-panel">
          <div className="card-heading">
            <div><p className="eyebrow">SHARE WITH GUESTS</p><h2>Scan to open</h2></div>
            <span className="wifi-icon" aria-hidden="true">⌁</span>
          </div>
          {join ? <>
            <div className="qr-frame"><img src={join.qrDataUrl} alt="QR code for the guest community" /></div>
            <p className="scan-hint">Guests must be connected to the venue Wi-Fi</p>
            <div className="link-row"><code>{join.url}</code><button className="copy-button" type="button" onClick={copyLink}>{copyState}</button></div>
          </> : <div className="empty-state" role="status">Preparing the current guest link…</div>}
        </section>
      )}
      <aside className="notice"><span className="notice-icon" aria-hidden="true">i</span><p><strong>Connection depends on your venue network.</strong> A firewall or Wi-Fi client isolation can block guest devices. Network access confirms reachability, not physical presence.</p></aside>
      </section>}

      {activeTab === "community" && <section id="host-panel-community" className="admin-tab-panel" role="tabpanel" aria-labelledby="host-tab-community" tabIndex={0}>
      <section className="admin-card host-community-card"><div><p className="eyebrow">HOST PARTICIPATION</p><h2>Join the community feed</h2><p className="card-copy">To publish publicly, open the shared feed and sign in with a regular community account. Admin credentials stay private.</p></div><a className="secondary-button" href="/" target="_blank" rel="noreferrer">Open community feed ↗</a></section>
      <AdminModeration />
      </section>}

      {activeTab === "security" && <section id="host-panel-security" className="admin-tab-panel" role="tabpanel" aria-labelledby="host-tab-security" tabIndex={0}>
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
      </section>}
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
  return window.location.pathname.startsWith("/admin") ? <Admin /> : <GuestWelcome />;
}

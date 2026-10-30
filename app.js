"use strict";
/* PassOn: campus give, swap and sell. Firebase Auth for login, Firestore for shared data. */

const CATS = ["Books", "Clothes", "Furniture", "Electronics", "Utensils", "Other"];
const CAT_COLORS = {
  Books: "linear-gradient(135deg,#3b6ea5,#1e3f66)",
  Clothes: "linear-gradient(135deg,#b4577a,#6e2b49)",
  Furniture: "linear-gradient(135deg,#9a7b4f,#5c4524)",
  Electronics: "linear-gradient(135deg,#4f8f8b,#25504d)",
  Utensils: "linear-gradient(135deg,#7a8f4f,#45542a)",
  Other: "linear-gradient(135deg,#7a7f8c,#42464f)"
};
const ZONES = ["All campus", "Hostel A common room", "Hostel B common room", "Girls hostel lobby", "Library entrance", "Main block gate", "Canteen"];
const NGOS = [
  { name: "Seva Sangh (sample)", takes: ["Clothes", "Furniture", "Utensils"], note: "Pickup within 2 days" },
  { name: "Pustak Mitra (sample)", takes: ["Books"], note: "Collects every Saturday" },
  { name: "Digital Daan Group (sample)", takes: ["Electronics"], note: "Refurbishes working devices" }
];
const MODE_LABEL = { all: "All modes", free: "Free", exchange: "Exchange", sell: "For sale" };

/* ---------- Firebase ---------- */
const CFG = window.PASSON_FIREBASE || {};
const configured = typeof firebase !== "undefined" && !!CFG.apiKey && !/^PASTE/.test(CFG.apiKey);
let auth = null, db = null, FV = null;
if (configured) {
  firebase.initializeApp(CFG);
  auth = firebase.auth();
  db = firebase.firestore();
  FV = firebase.firestore.FieldValue;
}

const state = {
  user: null,
  items: [], myReqs: [], incoming: [], threads: [], offers: [],
  f: { q: "", cat: "All", mode: "all", zone: "All campus" },
  unsubUser: [], chatUnsub: null, userCache: {}, authMode: "login", loaded: false
};

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const days = (ms) => Math.max(0, Math.floor((Date.now() - (ms || Date.now())) / 864e5));
const ago = (ms) => { const d = days(ms); return d === 0 ? "today" : d === 1 ? "1 day ago" : d + " days ago"; };
const rupees = (n) => "₹" + Number(n).toLocaleString("en-IN");
const me = () => (state.user ? state.user.uid : null);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3000);
}
function needFirebase() {
  if (configured) return false;
  toast("Firebase is not connected yet. See SETUP.md.");
  return true;
}
function needLogin() {
  if (needFirebase()) return true;
  if (state.user) return false;
  openAuth("login");
  toast("Log in first.");
  return true;
}
function dbError(e) {
  console.error(e);
  const code = e && e.code ? e.code : "";
  toast(code === "permission-denied" ? "Not allowed. Check the Firestore rules in SETUP.md." : "Something went wrong. Try again.");
}

/* ---------- Items ---------- */
function thumb(i) {
  const bg = i.photo ? `url(${i.photo})` : CAT_COLORS[i.cat] || CAT_COLORS.Other;
  return `<div class="thumb" style="background-image:${bg}" role="img" aria-label="${esc(i.cat)} item">${i.photo ? "" : esc((i.cat || "?").charAt(0))}</div>`;
}
function modeTag(i) {
  if (i.mode === "sell") return `<span class="tag sell">${rupees(i.price)}</span>`;
  return `<span class="tag ${i.mode === "free" ? "free" : "swap"}">${i.mode === "free" ? "Free" : "Exchange"}</span>`;
}
function tagsFor(i) {
  return `<div class="tags">${modeTag(i)}${i.status === "reserved" ? '<span class="tag reserved">Reserved</span>' : ""}${i.clean ? '<span class="tag clean">Cleaned</span>' : ""}${i.ownerId === me() ? '<span class="tag you">Yours</span>' : ""}</div>`;
}
const itemById = (id) => state.items.find((i) => i.id === id);

function chip(label, pressed, attr) {
  return `<button type="button" class="chip" ${attr} aria-pressed="${pressed}">${esc(label)}</button>`;
}
function renderFilters() {
  $("#catChips").innerHTML = ["All"].concat(CATS).map((c) => chip(c, state.f.cat === c, `data-cat="${esc(c)}"`)).join("");
  $("#modeChips").innerHTML = Object.keys(MODE_LABEL).map((v) => chip(MODE_LABEL[v], state.f.mode === v, `data-mode="${v}"`)).join("");
}
function renderGrid() {
  const { q, cat, mode, zone } = state.f;
  const list = state.items.filter((i) =>
    i.status !== "given" &&
    (cat === "All" || i.cat === cat) &&
    (mode === "all" || i.mode === mode) &&
    (zone === "All campus" || i.zone === zone) &&
    (!q || ((i.title || "") + " " + (i.cat || "")).toLowerCase().includes(q.toLowerCase())));
  $("#count").textContent = list.length + (list.length === 1 ? " item" : " items") + (zone === "All campus" ? " across campus" : " near " + zone);
  let empty = "Nothing matches yet. Try another category, or clear the search.";
  if (!configured) empty = "Connect Firebase to load items. See SETUP.md.";
  else if (state.loaded && !state.items.length) empty = "No items yet. Be the first to post one.";
  $("#grid").innerHTML = list.length ? list.map((i) => `
    <button class="card" data-open="${esc(i.id)}" type="button">
      ${thumb(i)}
      <div class="card-b">
        ${tagsFor(i)}
        <h3>${esc(i.title)}</h3>
        <span class="meta">${esc(i.zone)} · ${ago(i.createdAt)}</span>
      </div>
    </button>`).join("") : `<div class="empty">${esc(empty)}</div>`;
}

/* ---------- Owner rating ---------- */
async function ownerRating(uid) {
  if (!configured) return null;
  if (state.userCache[uid]) return state.userCache[uid];
  try {
    const s = await db.collection("users").doc(uid).get();
    const d = s.exists ? s.data() : {};
    const out = { count: d.ratingCount || 0, avg: d.ratingCount ? d.ratingSum / d.ratingCount : 0 };
    state.userCache[uid] = out;
    return out;
  } catch (e) { return null; }
}

/* ---------- Detail dialog ---------- */
function stopChat() { if (state.chatUnsub) { state.chatUnsub(); state.chatUnsub = null; } }
function openDialog() { const d = $("#detail"); if (!d.open) d.showModal(); }

function openDetail(id) {
  const i = itemById(id); if (!i) return;
  stopChat();
  const mine = i.ownerId === me();
  const req = state.myReqs.find((r) => r.itemId === id);
  const reserved = i.status === "reserved";
  const label = i.mode === "sell" ? "Ask to buy for " + rupees(i.price) : i.mode === "free" ? "Request this item" : "Offer an exchange";
  $("#dBody").innerHTML = `
    ${thumb(i)}
    ${tagsFor(i)}
    <h2 id="dTitle">${esc(i.title)}</h2>
    <dl class="kv">
      <dt>Category</dt><dd>${esc(i.cat)}</dd>
      <dt>Condition</dt><dd>${esc(i.cond)}${i.clean ? ", cleaned by owner" : ", not marked as cleaned"}</dd>
      ${i.mode === "exchange" ? `<dt>Wants</dt><dd>${esc(i.want || "Open to offers")}</dd>` : ""}
      ${i.mode === "sell" ? `<dt>Price</dt><dd>${rupees(i.price)}, pay at pickup</dd>` : ""}
      <dt>Pickup</dt><dd>${esc(i.zone)}</dd>
      <dt>Listed by</dt><dd>${esc(i.ownerName)} <span id="ownerRate" class="meta"></span></dd>
      ${i.note ? `<dt>Note</dt><dd>${esc(i.note)}</dd>` : ""}
    </dl>
    ${mine ? `<p class="meta">This is your listing.</p><button class="btn small" id="delBtn" type="button">Remove listing</button>` : `
    <div class="btn-row">
      <button class="btn primary" id="reqBtn" type="button" ${req || reserved ? "disabled" : ""}>${req ? "Requested" : reserved ? "Reserved" : esc(label)}</button>
      <button class="btn" id="msgBtn" type="button">Message ${esc(i.ownerName)}</button>
    </div>`}`;
  openDialog();
  ownerRating(i.ownerId).then((r) => { const el = $("#ownerRate"); if (el && r) el.textContent = r.count ? "· rated " + r.avg.toFixed(1) + " of 5 (" + r.count + ")" : "· no ratings yet"; });

  const rb = $("#reqBtn");
  if (rb) rb.onclick = async () => {
    if (needLogin()) return;
    rb.disabled = true;
    try {
      await db.collection("requests").add({
        itemId: i.id, itemTitle: i.title, mode: i.mode, price: i.price || 0,
        ownerId: i.ownerId, ownerName: i.ownerName,
        requesterId: me(), requesterName: state.user.name,
        status: "requested", createdAt: Date.now()
      });
      rb.textContent = "Requested";
      toast("Request sent to " + i.ownerName);
    } catch (e) { rb.disabled = false; dbError(e); }
  };
  const mb = $("#msgBtn");
  if (mb) mb.onclick = () => { if (needLogin()) return; openThread({ id: i.id + "_" + me(), itemId: i.id, itemTitle: i.title, ownerId: i.ownerId, ownerName: i.ownerName, requesterId: me(), requesterName: state.user.name }); };
  const db1 = $("#delBtn");
  if (db1) db1.onclick = async () => {
    if (!db1.dataset.sure) { db1.dataset.sure = "1"; db1.textContent = "Tap again to remove"; return; }
    try { await db.collection("items").doc(i.id).delete(); $("#detail").close(); toast("Listing removed."); } catch (e) { dbError(e); }
  };
}

/* ---------- Chat ---------- */
function openThread(t) {
  stopChat();
  const other = t.ownerId === me() ? t.requesterName : t.ownerName;
  $("#dBody").innerHTML = `
    <h2 id="dTitle">${esc(other)}</h2>
    <p class="meta">About: ${esc(t.itemTitle)}</p>
    <div class="chat">
      <div class="msgs" id="msgs" aria-live="polite"><p class="meta">No messages yet. Say hello and agree a time and place.</p></div>
      <form id="chatForm"><input id="chatIn" type="text" placeholder="Write a message" aria-label="Message" maxlength="200" autocomplete="off"><button class="btn small primary" type="submit">Send</button></form>
    </div>`;
  openDialog();
  const paint = (docs) => {
    const m = $("#msgs"); if (!m) return;
    if (!docs.length) return;
    m.innerHTML = docs.map((c) => `<div class="msg ${c.from === me() ? "me" : "them"}">${esc(c.text)}</div>`).join("");
    m.scrollTop = m.scrollHeight;
  };
  const listen = () => {
    if (state.chatUnsub) return;
    state.chatUnsub = db.collection("threads").doc(t.id).collection("messages").orderBy("at").onSnapshot(
      (s) => paint(s.docs.map((d) => d.data())), (e) => { console.error(e); });
  };
  if (state.threads.find((x) => x.id === t.id)) listen();
  $("#chatForm").onsubmit = async (e) => {
    e.preventDefault();
    const inp = $("#chatIn"); const text = inp.value.trim(); if (!text) return;
    inp.value = "";
    try {
      await db.collection("threads").doc(t.id).set({
        itemId: t.itemId, itemTitle: t.itemTitle, ownerId: t.ownerId, ownerName: t.ownerName,
        requesterId: t.requesterId, requesterName: t.requesterName,
        participants: [t.ownerId, t.requesterId], lastAt: Date.now(), lastText: text.slice(0, 60)
      }, { merge: true });
      await db.collection("threads").doc(t.id).collection("messages").add({ from: me(), name: state.user.name, text, at: Date.now() });
      listen();
    } catch (err) { inp.value = text; dbError(err); }
  };
}

/* ---------- Post an item ---------- */
function compress(file) {
  return new Promise((resolve) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 640 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}
function setupAdd() {
  $("#fCat").innerHTML = CATS.map((c) => `<option>${esc(c)}</option>`).join("");
  $("#fZone").innerHTML = ZONES.slice(1).map((z) => `<option>${esc(z)}</option>`).join("");
  let photo = "";
  $("#fPhoto").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    photo = await compress(f);
    const p = $("#photoPrev"); if (photo) { p.src = photo; p.hidden = false; }
  };
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.onchange = () => {
    const m = document.querySelector('input[name="mode"]:checked').value;
    $("#fWant").hidden = m !== "exchange";
    $("#fPrice").hidden = m !== "sell";
    $("#ePrice").hidden = true;
  });
  $("#addForm").onsubmit = async (e) => {
    e.preventDefault();
    if (needLogin()) return;
    const title = $("#fTitle").value.trim();
    $("#eTitle").hidden = !!title;
    if (!title) { $("#fTitle").focus(); return; }
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const price = Math.floor(Number($("#fPrice").value));
    if (mode === "sell" && !(price >= 1)) { $("#ePrice").hidden = false; $("#fPrice").focus(); return; }
    const btn = $("#addBtn"); btn.disabled = true; btn.textContent = "Posting...";
    try {
      await db.collection("items").add({
        title, cat: $("#fCat").value, mode,
        want: mode === "exchange" ? $("#fWant").value.trim() : "",
        price: mode === "sell" ? price : 0,
        cond: $("#fCond").value, zone: $("#fZone").value,
        clean: $("#fClean").checked, note: $("#fNote").value.trim(), photo,
        status: "available", ownerId: me(), ownerName: state.user.name, createdAt: Date.now()
      });
      e.target.reset(); photo = ""; $("#photoPrev").hidden = true; $("#fWant").hidden = true; $("#fPrice").hidden = true;
      toast("Item posted.");
      location.hash = "#me";
    } catch (err) { dbError(err); }
    btn.disabled = false; btn.textContent = "Post item";
  };
}

/* ---------- NGO ---------- */
function renderNgo() {
  $("#ngoList").innerHTML = NGOS.map((n) => `
    <div class="row-card"><div><strong>${esc(n.name)}</strong><div class="meta">Takes: ${esc(n.takes.join(", "))} · ${esc(n.note)}</div></div></div>`).join("");
  if (!state.user) { $("#unclaimed").innerHTML = `<div class="empty">Log in to see your unclaimed items.</div>`; return; }
  const old = state.items.filter((i) => i.ownerId === me() && i.status === "available" && days(i.createdAt) >= 7);
  $("#unclaimed").innerHTML = (old.length ? old.map((i) => {
    const ngo = NGOS.find((n) => n.takes.includes(i.cat));
    const done = state.offers.includes(i.id);
    return `<div class="row-card"><div><strong>${esc(i.title)}</strong><div class="meta">Listed ${ago(i.createdAt)}, no taker yet</div></div>
      ${ngo ? `<button class="btn small primary" data-ngo="${esc(i.id)}" type="button" ${done ? "disabled" : ""}>${done ? "Offer saved" : "Offer to " + esc(ngo.name)}</button>` : `<span class="meta">No NGO takes this category yet</span>`}</div>`;
  }).join("") : `<div class="empty">None right now. Items without a taker for 7 days will appear here.</div>`)
    + `<p class="meta">Prototype note: this saves your offer. The sample NGOs are not contacted.</p>`;
}

/* ---------- My activity ---------- */
const STATUS_TEXT = { requested: "Waiting for the owner", accepted: "Accepted, arrange pickup", declined: "Declined", picked: "Picked up" };
function renderMe() {
  $("#meGate").hidden = !!state.user;
  $("#meBody").hidden = !state.user;
  if (!state.user) return;
  const mine = state.items.filter((i) => i.ownerId === me());
  const passed = mine.filter((i) => i.status === "given").length + state.myReqs.filter((r) => r.status === "picked").length;
  $("#stats").innerHTML = [[mine.length, "Items you posted"], [state.myReqs.length, "Requests you made"], [passed, "Items kept out of the bin"]]
    .map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("");
  $("#myItems").innerHTML = mine.length ? mine.map((i) => `<div class="row-card"><div><strong>${esc(i.title)}</strong><div class="meta">${i.mode === "sell" ? rupees(i.price) : i.mode === "free" ? "Free" : "Exchange"} · ${esc(i.zone)} · ${esc(i.status)} · ${ago(i.createdAt)}</div></div><button class="btn small" data-open="${esc(i.id)}" type="button">View</button></div>`).join("")
    : `<div class="empty">You have not posted anything yet.</div>`;

  const inc = state.incoming.slice().sort((a, b) => b.createdAt - a.createdAt);
  $("#incoming").innerHTML = inc.length ? inc.map((r) => {
    let act = `<span class="meta">${esc(STATUS_TEXT[r.status] || r.status)}</span>`;
    if (r.status === "requested") act = `<div class="btn-row"><button class="btn small primary" data-accept="${esc(r.id)}" type="button">Accept</button><button class="btn small" data-decline="${esc(r.id)}" type="button">Decline</button></div>`;
    else if (r.status === "accepted") act = `<button class="btn small primary" data-given="${esc(r.id)}" type="button">Mark as given</button>`;
    return `<div class="row-card"><div><strong>${esc(r.requesterName)}</strong> wants <strong>${esc(r.itemTitle)}</strong><div class="meta">${r.mode === "sell" ? "Buying at " + rupees(r.price) : r.mode === "exchange" ? "Exchange offer" : "Free request"} · ${ago(r.createdAt)}</div></div>${act}</div>`;
  }).join("") : `<div class="empty">No requests yet.</div>`;

  const mr = state.myReqs.slice().sort((a, b) => b.createdAt - a.createdAt);
  $("#myReqs").innerHTML = mr.length ? mr.map((r) => {
    let act = `<span class="meta">${esc(STATUS_TEXT[r.status] || r.status)}</span>`;
    if (r.status === "picked") act = r.score ? `<span class="meta">You rated ${r.score} of 5</span>` :
      `<div class="stars" role="group" aria-label="Rate ${esc(r.ownerName)}">${[1, 2, 3, 4, 5].map((n) => `<button class="star" type="button" data-rate="${esc(r.id)}:${n}" aria-label="${n} star${n > 1 ? "s" : ""}">${n}</button>`).join("")}</div>`;
    return `<div class="row-card"><div><strong>${esc(r.itemTitle)}</strong><div class="meta">From ${esc(r.ownerName)} · ${ago(r.createdAt)}</div></div>${act}</div>`;
  }).join("") : `<div class="empty">No requests yet. Browse items and request one.</div>`;

  const th = state.threads.slice().sort((a, b) => b.lastAt - a.lastAt);
  $("#threads").innerHTML = th.length ? th.map((t) => {
    const other = t.ownerId === me() ? t.requesterName : t.ownerName;
    return `<div class="row-card"><div><strong>${esc(other)}</strong><div class="meta">${esc(t.itemTitle)} · ${esc(t.lastText || "")}</div></div><button class="btn small" data-thread="${esc(t.id)}" type="button">Open</button></div>`;
  }).join("") : `<div class="empty">No messages yet.</div>`;
}

/* ---------- Auth ---------- */
function renderAuth() {
  $("#authArea").innerHTML = state.user
    ? `<span class="who">${esc(state.user.name)}</span> <button class="btn small" type="button" data-act="logout">Log out</button>`
    : `<button class="btn small primary" type="button" data-auth="login">Log in</button>`;
  $("#addGate").hidden = !!state.user;
  $("#addForm").hidden = !state.user;
}
function openAuth(mode) {
  if (needFirebase()) return;
  setAuthMode(mode || "login");
  $("#aErr").hidden = true;
  const d = $("#authDlg"); if (!d.open) d.showModal();
  $("#aEmail").focus();
}
function setAuthMode(m) {
  state.authMode = m;
  const su = m === "signup";
  $("#aTitle").textContent = su ? "Create account" : "Log in";
  $("#aSubmit").textContent = su ? "Sign up" : "Log in";
  $("#nameField").hidden = !su;
  $("#aPass").autocomplete = su ? "new-password" : "current-password";
  $("#segLogin").setAttribute("aria-pressed", String(!su));
  $("#segSignup").setAttribute("aria-pressed", String(su));
}
const AUTH_ERR = {
  "auth/email-already-in-use": "This email already has an account. Log in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/invalid-credential": "Email or password is wrong.",
  "auth/user-not-found": "No account with this email. Sign up first.",
  "auth/wrong-password": "Email or password is wrong.",
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/network-request-failed": "No internet connection."
};
function setupAuth() {
  $("#segLogin").onclick = () => setAuthMode("login");
  $("#segSignup").onclick = () => setAuthMode("signup");
  $("#aClose").onclick = () => $("#authDlg").close();
  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#aEmail").value.trim(), pass = $("#aPass").value, name = $("#aName").value.trim();
    const err = $("#aErr"); err.hidden = true;
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    if (!email || !pass) return fail("Enter your email and password.");
    if (state.authMode === "signup" && !name) return fail("Enter your name.");
    const btn = $("#aSubmit"); btn.disabled = true;
    try {
      if (state.authMode === "signup") {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await cred.user.updateProfile({ displayName: name });
        await db.collection("users").doc(cred.user.uid).set({ name, email, ratingSum: 0, ratingCount: 0, createdAt: Date.now() });
        state.user = { uid: cred.user.uid, name, email };
        renderAuth(); renderMe();
      } else {
        await auth.signInWithEmailAndPassword(email, pass);
      }
      $("#authForm").reset();
      $("#authDlg").close();
      toast(state.authMode === "signup" ? "Account created." : "Logged in.");
    } catch (e2) { fail(AUTH_ERR[e2.code] || "Could not continue. Try again."); }
    btn.disabled = false;
  };
}

/* ---------- Live data ---------- */
function stopUser() { state.unsubUser.forEach((f) => f()); state.unsubUser = []; }
const docs = (s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
function refresh() {
  renderGrid();
  const tab = currentTab();
  if (tab === "ngo") renderNgo();
  if (tab === "me") renderMe();
}
function listenItems() {
  db.collection("items").orderBy("createdAt", "desc").limit(200).onSnapshot((s) => {
    state.items = docs(s); state.loaded = true; refresh();
  }, (e) => { state.loaded = true; dbError(e); refresh(); });
}
function listenUser(uid) {
  stopUser();
  const on = (q, key, map) => state.unsubUser.push(q.onSnapshot((s) => { state[key] = map ? map(s) : docs(s); refresh(); }, (e) => console.error(e)));
  on(db.collection("requests").where("requesterId", "==", uid), "myReqs");
  on(db.collection("requests").where("ownerId", "==", uid), "incoming");
  on(db.collection("threads").where("participants", "array-contains", uid), "threads");
  on(db.collection("ngoOffers").where("ownerId", "==", uid), "offers", (s) => s.docs.map((d) => d.data().itemId));
}

/* ---------- Actions ---------- */
async function setRequest(reqId, status, itemStatus) {
  const r = state.incoming.find((x) => x.id === reqId); if (!r) return;
  try {
    const b = db.batch();
    b.update(db.collection("requests").doc(reqId), { status });
    if (itemStatus) b.update(db.collection("items").doc(r.itemId), { status: itemStatus });
    await b.commit();
  } catch (e) { dbError(e); }
}
async function rate(reqId, n) {
  const r = state.myReqs.find((x) => x.id === reqId); if (!r || r.score) return;
  try {
    const b = db.batch();
    b.update(db.collection("requests").doc(reqId), { score: n });
    b.update(db.collection("users").doc(r.ownerId), { ratingSum: FV.increment(n), ratingCount: FV.increment(1) });
    await b.commit();
    delete state.userCache[r.ownerId];
    toast("Thanks for rating.");
  } catch (e) { dbError(e); }
}
async function offerNgo(itemId) {
  const i = itemById(itemId); if (!i) return;
  const ngo = NGOS.find((n) => n.takes.includes(i.cat)); if (!ngo) return;
  try {
    await db.collection("ngoOffers").add({ itemId, itemTitle: i.title, ngo: ngo.name, ownerId: me(), createdAt: Date.now() });
    toast("Offer saved.");
  } catch (e) { dbError(e); }
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a"); if (!t) return;
  const d = t.dataset;
  if (d.open) openDetail(d.open);
  else if (d.cat) { state.f.cat = d.cat; renderFilters(); renderGrid(); }
  else if (d.mode) { state.f.mode = d.mode; renderFilters(); renderGrid(); }
  else if (d.auth) openAuth(d.auth);
  else if (d.act === "logout") { auth.signOut().then(() => toast("Logged out.")); }
  else if (d.accept) setRequest(d.accept, "accepted", "reserved");
  else if (d.decline) setRequest(d.decline, "declined", null);
  else if (d.given) setRequest(d.given, "picked", "given");
  else if (d.rate) { const [id, n] = d.rate.split(":"); rate(id, Number(n)); }
  else if (d.ngo) offerNgo(d.ngo);
  else if (d.thread) { const th = state.threads.find((x) => x.id === d.thread); if (th) openThread(th); }
});
$("#dClose").onclick = () => $("#detail").close();
$("#detail").addEventListener("close", stopChat);
$("#detail").addEventListener("click", (e) => { if (e.target === $("#detail")) $("#detail").close(); });
$("#authDlg").addEventListener("click", (e) => { if (e.target === $("#authDlg")) $("#authDlg").close(); });
$("#q").addEventListener("input", (e) => { state.f.q = e.target.value; renderGrid(); });
$("#zoneSelect").innerHTML = ZONES.map((z) => `<option>${esc(z)}</option>`).join("");
$("#zoneSelect").addEventListener("change", (e) => { state.f.zone = e.target.value; renderGrid(); });

/* ---------- Routing ---------- */
const TABS = ["browse", "add", "ngo", "me"];
function currentTab() { const h = location.hash.slice(1); return TABS.includes(h) ? h : "browse"; }
function route() {
  const tab = currentTab();
  TABS.forEach((t) => { $("#view-" + t).hidden = t !== tab; });
  document.querySelectorAll(".tabs a").forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (tab === "ngo") renderNgo();
  if (tab === "me") renderMe();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ---------- Start ---------- */
renderFilters(); renderGrid(); setupAdd(); setupAuth(); renderAuth(); route();
if (!configured) {
  $("#setupBanner").hidden = false;
} else {
  listenItems();
  auth.onAuthStateChanged((u) => {
    if (u) {
      state.user = { uid: u.uid, name: u.displayName || (u.email || "").split("@")[0], email: u.email };
      listenUser(u.uid);
    } else {
      state.user = null; stopUser();
      state.myReqs = []; state.incoming = []; state.threads = []; state.offers = [];
    }
    renderAuth(); refresh();
  });
}

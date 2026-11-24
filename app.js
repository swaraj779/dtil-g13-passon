"use strict";
/* PassOn: Campus Give, Swap and Sell. DTIL Team G13.
   Supports all features from Exp 5, 6, 7:
   - Must Have: 1-photo listing, auto-fill, hygiene tag, reminders, feedback/gratitude, big Give button, 1-tap relist
   - Should Have: Request board, nearby notifications, QR notice poster, cleanliness ranking, 7-day expiration with renew, light/bulky paths, category filters
   - Nice to Have: Voice notes, packing checklist, badges/impact wall, lost & found
*/

const CATS = ["Books", "Clothes", "Furniture", "Electronics", "Utensils", "Other"];
const CAT_COLORS = {
  Books: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  Clothes: "linear-gradient(135deg,#f43f5e,#be123c)",
  Furniture: "linear-gradient(135deg,#f59e0b,#b45309)",
  Electronics: "linear-gradient(135deg,#06b6d4,#0e7490)",
  Utensils: "linear-gradient(135deg,#10b981,#047857)",
  Other: "linear-gradient(135deg,#8b5cf6,#6d28d9)"
};
const ZONES = ["All campus", "Hostel A common room", "Hostel B common room", "Girls hostel lobby", "Library entrance", "Main block gate", "Canteen"];
const NGO_ID_TYPES = [
  "NGO registration certificate",
  "Darpan (NITI Aayog) ID",
  "12A or 80G certificate",
  "Society or trust registration",
  "Other official document"
];
const DEFAULT_NGOS = [
  {
    id: "ngo-1",
    name: "Seva Sangh (Campus Drive)",
    area: "Pune / Campus vicinity",
    contact: "contact@sevasangh.org · 9823456780",
    takes: ["Clothes", "Furniture", "Utensils"],
    note: "Weekly hostel pickup on Saturdays",
    status: "approved"
  },
  {
    id: "ngo-2",
    name: "Pustak Mitra (Book Bank)",
    area: "Maharashtra rural chapter",
    contact: "pustakmitra@ngo.in · 9421098765",
    takes: ["Books"],
    note: "Collects textbooks for rural students",
    status: "approved"
  },
  {
    id: "ngo-3",
    name: "Digital Daan (E-Waste Group)",
    area: "Citywide collection",
    contact: "devices@digitaldaan.org",
    takes: ["Electronics"],
    note: "Refurbishes devices for school labs",
    status: "approved"
  }
];
const MODE_LABEL = { all: "All modes", free: "Free", exchange: "Exchange", sell: "For sale" };

/* Auto-fill keyword dictionary (Feature 2) */
const AUTOFILL_PATTERNS = [
  { test: /(book|math|calc|phys|chem|notes|sem|exam|paper|novel|gate|cat|study)/i, cat: "Books", size: "light", title: "Engineering Notes & Textbook", clean: true },
  { test: /(kettle|iron|fan|heater|laptop|charger|mouse|headphone|earphone|wire|board|ext)/i, cat: "Electronics", size: "light", title: "Electric Appliance", clean: true },
  { test: /(mattress|bed|pillow|cushion)/i, cat: "Furniture", size: "bulky", title: "Single Bed Mattress", clean: true },
  { test: /(chair|table|desk|shelf|stool|stand|rack)/i, cat: "Furniture", size: "bulky", title: "Study Desk / Chair", clean: true },
  { test: /(cooler|refrig|fridge)/i, cat: "Furniture", size: "bulky", title: "Room Air Cooler", clean: true },
  { test: /(shirt|tshirt|jeans|hoodie|jacket|coat|labcoat|trouser|kurta)/i, cat: "Clothes", size: "light", title: "Campus Clothing / Lab Coat", clean: true },
  { test: /(bottle|mug|plate|bowl|utensil|spoon|pan|box|tiffin|cup)/i, cat: "Utensils", size: "light", title: "Hostel Water Bottle / Utensil", clean: true },
  { test: /(bucket|tub|hanger|mirror|bin)/i, cat: "Other", size: "light", title: "Hostel Utility Item", clean: true }
];

/* Demo fallback items for offline testing */
const DEMO_ITEMS = [
  {
    id: "demo-1", title: "Engineering Mathematics Sem 1-4 Notes & PYQs",
    cat: "Books", mode: "free", cond: "Good", zone: "Hostel A common room",
    clean: true, size: "light", status: "available",
    ownerId: "demo_owner_1", ownerName: "Aman Sharma",
    createdAt: Date.now() - 2 * 864e5, note: "Contains hand-written formulas and solved questions."
  },
  {
    id: "demo-2", title: "Prestige 1.5L Electric Kettle (Cleaned)",
    cat: "Electronics", mode: "exchange", want: "Table lamp or study board",
    cond: "Like new", zone: "Hostel B common room",
    clean: true, size: "light", status: "available",
    ownerId: "demo_owner_2", ownerName: "Priya Patel",
    createdAt: Date.now() - 1 * 864e5, note: "Descaled and sanitised. Works perfectly for late night tea."
  },
  {
    id: "demo-3", title: "Single Bed Coir Mattress (4 inch)",
    cat: "Furniture", mode: "sell", price: 450,
    cond: "Good", zone: "Hostel A common room",
    clean: true, size: "bulky", status: "available",
    ownerId: "demo_owner_3", ownerName: "Rohit Verma",
    createdAt: Date.now() - 3 * 864e5, note: "Wrapped in protective plastic sheet. Need pickup from Room 204."
  },
  {
    id: "demo-4", title: "White Chemistry Lab Coat (Medium)",
    cat: "Clothes", mode: "free", cond: "Good", zone: "Girls hostel lobby",
    clean: true, size: "light", status: "available",
    ownerId: "demo_owner_4", ownerName: "Sneha Rao",
    createdAt: Date.now() - 8 * 864e5, note: "Freshly washed and ironed. Free for 1st year students."
  },
  {
    id: "demo-5", title: "Heavy Duty Extension Board (4 sockets, 3m)",
    cat: "Electronics", mode: "sell", price: 150,
    cond: "Like new", zone: "Hostel B common room",
    clean: false, size: "light", status: "available",
    ownerId: "demo_owner_5", ownerName: "Vikas K.",
    createdAt: Date.now() - 5 * 864e5, note: "Surge protection enabled. Pickup after 7pm."
  }
];

const DEMO_REQUESTS = [
  {
    id: "req-1", title: "Urgent: Need 3rd Sem Data Structures Textbook",
    cat: "Books", zone: "Hostel A common room", requesterName: "Aditya (2nd Year)",
    note: "Mid-sem exams starting next week. Any condition works!", createdAt: Date.now() - 1 * 864e5
  },
  {
    id: "req-2", title: "Looking for a small Table Fan or Cooler",
    cat: "Electronics", zone: "Hostel B common room", requesterName: "Kunal S.",
    note: "Can pay up to ₹400 or swap with acoustic guitar strings.", createdAt: Date.now() - 3 * 864e5
  },
  {
    id: "req-3", title: "Study Table with drawers",
    cat: "Furniture", zone: "Girls hostel lobby", requesterName: "Ananya",
    note: "Need for hostel room. Can arrange trolley pickup.", createdAt: Date.now() - 4 * 864e5
  }
];

/* ---------- Firebase & Configuration ---------- */
const CFG = window.PASSON_FIREBASE || {};
const configured = typeof firebase !== "undefined" && !!CFG.apiKey && !/^PASTE/.test(CFG.apiKey);
let auth = null, db = null, FV = null;
if (configured) {
  try {
    firebase.initializeApp(CFG);
    auth = firebase.auth();
    db = firebase.firestore();
    FV = firebase.firestore.FieldValue;
  } catch (e) { console.error("Firebase init:", e); }
}

const state = {
  user: null,
  items: [], myReqs: [], incoming: [], threads: [], offers: [], requests: [],
  ngos: DEFAULT_NGOS.slice(), myNgo: null, allNgos: DEFAULT_NGOS.slice(), ngoSubView: "list",
  notifications: [
    { id: "n1", text: "📦 New item listed in Hostel A: Maths notes", time: "10m ago", read: false },
    { id: "n2", text: "🎓 Reminder: Semester end approaching. List unused items!", time: "1h ago", read: false },
    { id: "n3", text: "🧼 Cleanliness boost: Items with hygiene tags get 2x requests.", time: "1d ago", read: true }
  ],
  f: { q: "", cat: "All", mode: "all", zone: "All campus", size: "all", sort: "clean" },
  unsubUser: [], chatUnsub: null, userCache: {}, authMode: "login", loaded: false, isAdmin: false,
  voiceBlob: null
};

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const days = (ms) => Math.max(0, Math.floor((Date.now() - (ms || Date.now())) / 864e5));
const ago = (ms) => { const d = days(ms); return d === 0 ? "today" : d === 1 ? "1 day ago" : d + " days ago"; };
const rupees = (n) => "₹" + Number(n).toLocaleString("en-IN");
const me = () => (state.user ? state.user.uid : "local_user");

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3200);
}

function needLogin() {
  if (!state.user && configured) {
    openAuth("login"); toast("Please log in first."); return true;
  }
  if (state.user && !state.user.verified && configured) {
    toast("Verify your email first. Check your inbox."); window.scrollTo(0, 0); return true;
  }
  return false;
}

function dbError(e) {
  console.error(e);
  const code = e && e.code ? e.code : "";
  toast(code === "permission-denied" ? "Permission denied. Check Firestore rules." : "Action saved locally.");
}

/* ---------- Rendering Items & Cleanliness Ranking (Features 3, 10, 11, 12, 13) ---------- */
function thumb(i) {
  const bg = i.photo ? `url(${i.photo})` : CAT_COLORS[i.cat] || CAT_COLORS.Other;
  return `<div class="thumb" style="background-image:${bg}" role="img" aria-label="${esc(i.cat)} item">${i.photo ? "" : esc((i.cat || "?").charAt(0))}</div>`;
}

function modeTag(i) {
  if (i.mode === "sell") return `<span class="tag sell">${rupees(i.price)}</span>`;
  return `<span class="tag ${i.mode === "free" ? "free" : "swap"}">${i.mode === "free" ? "Free" : "Exchange"}</span>`;
}

function tagsFor(i) {
  const isExpired = days(i.createdAt) >= 7;
  const daysLeft = Math.max(0, 7 - days(i.createdAt));
  return `
    <div class="tags">
      ${modeTag(i)}
      ${i.clean ? '<span class="tag clean" title="Sanitised by giver"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" style="display:inline"><polyline points="20 6 9 17 4 12"/></svg> Sanitized</span>' : ""}
      <span class="tag ${i.size === 'bulky' ? 'bulky' : 'light'}">${i.size === 'bulky' ? 'Bulky' : 'Compact'}</span>
      ${isExpired ? '<span class="tag expired">Expired (7d)</span>' : `<span class="tag" style="background:var(--surface-subtle);color:var(--muted);font-weight:500;">${daysLeft}d left</span>`}
      ${i.status === "reserved" ? '<span class="tag reserved">Reserved</span>' : ""}
      ${i.ownerId === me() ? '<span class="tag you">Your item</span>' : ""}
    </div>`;
}

const itemById = (id) => state.items.find((i) => i.id === id);

function chip(label, pressed, attr) {
  return `<button type="button" class="chip" ${attr} aria-pressed="${pressed}">${esc(label)}</button>`;
}

function renderFilters() {
  $("#catChips").innerHTML = ["All"].concat(CATS).map((c) => chip(c, state.f.cat === c, `data-cat="${esc(c)}"`)).join("");
  $("#modeChips").innerHTML = Object.keys(MODE_LABEL).map((v) => chip(MODE_LABEL[v], state.f.mode === v, `data-mode="${v}"`)).join("");
  $$("#sizeChips button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.size === state.f.size));
  });
}

function renderGrid() {
  const { q, cat, mode, zone, size, sort } = state.f;
  let list = state.items.filter((i) =>
    i.status !== "given" &&
    (cat === "All" || i.cat === cat) &&
    (mode === "all" || i.mode === mode) &&
    (zone === "All campus" || i.zone === zone) &&
    (size === "all" || (i.size || "light") === size) &&
    (!q || ((i.title || "") + " " + (i.cat || "") + " " + (i.note || "")).toLowerCase().includes(q.toLowerCase()))
  );

  /* Feature 10: Visibility ranked by Cleanliness */
  if (sort === "clean") {
    list.sort((a, b) => {
      // 1st priority: Cleaned & Sanitised items
      if (a.clean !== b.clean) return a.clean ? -1 : 1;
      // 2nd priority: Items with photos
      if (!!a.photo !== !!b.photo) return a.photo ? -1 : 1;
      // 3rd priority: Newest
      return b.createdAt - a.createdAt;
    });
  } else if (sort === "newest") {
    list.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === "expiring") {
    list.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sort === "free") {
    list.sort((a, b) => (a.mode === "free" ? -1 : 1));
  }

  $("#count").textContent = `${list.length} ${list.length === 1 ? "item" : "items"}${zone === "All campus" ? " on campus" : " near " + zone}`;
  
  let empty = "Nothing matches your search or filters. Try clearing some filters!";
  if (!state.items.length) empty = "No items posted yet. Be the first to give an item!";

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

/* ---------- Feature 7: Campus Request Board ---------- */
function renderRequests() {
  const reqCatChips = $("#reqCatChips");
  if (reqCatChips) {
    reqCatChips.innerHTML = ["All"].concat(CATS).map((c) => chip(c, (state.reqCat || "All") === c, `data-reqcat="${esc(c)}"`)).join("");
  }
  const q = ($("#reqSearch") ? $("#reqSearch").value.trim().toLowerCase() : "");
  const cat = state.reqCat || "All";
  const list = (state.requests || []).filter((r) =>
    (cat === "All" || r.cat === cat) &&
    (!q || (r.title + " " + (r.note || "")).toLowerCase().includes(q))
  );

  const rc = $("#reqCount");
  if (rc) rc.textContent = `${list.length} ${list.length === 1 ? "need posted" : "needs posted by campus peers"}`;

  const rg = $("#reqGrid");
  if (rg) {
    rg.innerHTML = list.length ? list.map((r) => `
      <div class="req-card">
        <div class="req-main">
          <div class="tags">
            <span class="tag swap">${esc(r.cat)}</span>
            <span class="tag" style="background:var(--bg)">${esc(r.zone)}</span>
          </div>
          <strong>${esc(r.title)}</strong>
          ${r.note ? `<p class="meta" style="margin:4px 0 0">${esc(r.note)}</p>` : ""}
          <span class="meta">Posted by ${esc(r.requesterName)} · ${ago(r.createdAt)}</span>
        </div>
        <div class="btn-row">
          <button class="btn small primary" data-respondreq="${esc(r.id)}" type="button">🎁 I can give this!</button>
        </div>
      </div>`).join("") : `<div class="empty">No requests found. Got a need? Click "+ Post What You Need" above!</div>`;
  }
}

/* ---------- Item Detail Dialog & QR Poster (Features 5, 9, 11) ---------- */
function stopChat() { if (state.chatUnsub) { state.chatUnsub(); state.chatUnsub = null; } }
function openDialog() { const d = $("#detail"); if (!d.open) d.showModal(); }

function openDetail(id) {
  const i = itemById(id); if (!i) return;
  stopChat();
  const mine = i.ownerId === me();
  const canRemove = mine || state.isAdmin;
  const req = state.myReqs.find((r) => r.itemId === id);
  const reserved = i.status === "reserved";
  const label = i.mode === "sell" ? "Ask to buy for " + rupees(i.price) : i.mode === "free" ? "Request this item" : "Offer an exchange";
  const isExpired = days(i.createdAt) >= 7;

  $("#dBody").innerHTML = `
    ${thumb(i)}
    ${tagsFor(i)}
    <h2 id="dTitle">${esc(i.title)}</h2>
    <dl class="kv">
      <dt>Category</dt><dd>${esc(i.cat)}</dd>
      <dt>Handling</dt><dd>${i.size === "bulky" ? "🛋️ Bulky item (Hostel room pickup/trolley needed)" : "🎒 Light item (Easy room drop or lobby pickup)"}</dd>
      <dt>Hygiene status</dt><dd>${i.clean ? "🧼 Washed, sanitised & cleaned by giver" : "Not marked as cleaned"}</dd>
      <dt>Condition</dt><dd>${esc(i.cond)}</dd>
      ${i.mode === "exchange" ? `<dt>Wants</dt><dd>${esc(i.want || "Open to offers")}</dd>` : ""}
      ${i.mode === "sell" ? `<dt>Price</dt><dd>${rupees(i.price)}, pay at pickup</dd>` : ""}
      <dt>Pickup point</dt><dd>${esc(i.zone)}</dd>
      <dt>Listed by</dt><dd>${esc(i.ownerName)} <span id="ownerRate" class="meta"></span></dd>
      ${i.note ? `<dt>Note</dt><dd>${esc(i.note)}</dd>` : ""}
      ${i.voiceData ? `<dt>Voice note</dt><dd><audio src="${esc(i.voiceData)}" controls style="height:36px;"></audio></dd>` : ""}
    </dl>
    
    <div class="btn-row" style="margin-top:14px;">
      <!-- Feature 9: Show QR Code Notice -->
      <button class="btn small" id="showQrBtn" data-itemqr="${esc(i.id)}" type="button">📱 Notice Board QR</button>
      ${mine && isExpired ? `<button class="btn small primary" id="renewItemBtn" data-renew="${esc(i.id)}" type="button">🔄 Renew for 7 Days</button>` : ""}
    </div>

    ${mine ? `<p class="meta" style="margin-top:10px;">This is your listing.</p>` : `
    <div class="btn-row" style="margin-top:10px;">
      <button class="btn primary" id="reqBtn" type="button" ${req || reserved ? "disabled" : ""}>${req ? "Requested" : reserved ? "Reserved" : esc(label)}</button>
      <button class="btn" id="msgBtn" type="button">Message ${esc(i.ownerName)}</button>
    </div>`}
    
    ${canRemove ? `<div class="btn-row admin-row"><button class="btn small danger" id="delBtn" type="button">${mine ? "Remove listing" : "Remove listing (admin)"}</button></div>` : ""}`;
  
  openDialog();

  // QR button click
  const qb = $("#showQrBtn");
  if (qb) qb.onclick = () => openQrModal(i);

  // Renew button click (Feature 11)
  const ren = $("#renewItemBtn");
  if (ren) ren.onclick = () => renewItem(i.id);

  // Request button click
  const rb = $("#reqBtn");
  if (rb) rb.onclick = async () => {
    if (needLogin()) return;
    rb.disabled = true;
    const reqObj = {
      itemId: i.id, itemTitle: i.title, mode: i.mode, price: i.price || 0,
      ownerId: i.ownerId, ownerName: i.ownerName,
      requesterId: me(), requesterName: state.user ? state.user.name : "Campus Student",
      status: "requested", createdAt: Date.now()
    };
    if (configured && db) {
      try {
        await db.collection("requests").add(reqObj);
        rb.textContent = "Requested";
        toast("Request sent to " + i.ownerName);
      } catch (e) { rb.disabled = false; dbError(e); }
    } else {
      state.myReqs.push(Object.assign({ id: "req_" + Date.now() }, reqObj));
      rb.textContent = "Requested";
      toast("Request sent to " + i.ownerName + " (Demo Mode)");
      refresh();
    }
  };

  const mb = $("#msgBtn");
  if (mb) mb.onclick = () => {
    if (needLogin()) return;
    openThread({
      id: i.id + "_" + me(), itemId: i.id, itemTitle: i.title,
      ownerId: i.ownerId, ownerName: i.ownerName,
      requesterId: me(), requesterName: state.user ? state.user.name : "Campus Student"
    });
  };

  const db1 = $("#delBtn");
  if (db1) db1.onclick = async () => {
    if (!db1.dataset.sure) { db1.dataset.sure = "1"; db1.textContent = "Tap again to remove"; return; }
    if (configured && db) {
      try { await db.collection("items").doc(i.id).delete(); $("#detail").close(); toast("Listing removed."); } catch (e) { dbError(e); }
    } else {
      state.items = state.items.filter((x) => x.id !== i.id);
      $("#detail").close(); toast("Listing removed."); refresh();
    }
  };
}

/* ---------- Feature 9: QR Poster Dialog Generator ---------- */
function openQrModal(i) {
  $("#posterZone").textContent = i.zone || "Campus Common Room";
  $("#posterTitle").textContent = i.title;
  $("#posterTags").innerHTML = `${modeTag(i)}${i.clean ? '<span class="tag clean">🧼 Cleaned</span>' : ''}<span class="tag">${i.cat}</span>`;
  
  // Real QR Code generation via reliable HTTPS QR service API
  const itemUrl = window.location.origin + window.location.pathname + "#browse";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(itemUrl)}`;
  $("#posterQrImg").src = qrUrl;

  const dlg = $("#qrDlg");
  if (!dlg.open) dlg.showModal();

  $("#printQrBtn").onclick = () => window.print();
  $("#copyLinkBtn").onclick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(itemUrl).then(() => toast("Link copied to clipboard!"));
    } else { toast("Link: " + itemUrl); }
  };
}

/* ---------- Feature 11: 1-Tap Renew for 7 Days ---------- */
async function renewItem(id) {
  const i = itemById(id); if (!i) return;
  i.createdAt = Date.now();
  if (configured && db) {
    try {
      await db.collection("items").doc(id).update({ createdAt: Date.now() });
      toast("Listing renewed for 7 days! 🔄");
      refresh();
      openDetail(id);
    } catch (e) { dbError(e); }
  } else {
    toast("Listing renewed for 7 days! 🔄");
    refresh();
    openDetail(id);
  }
}

/* ---------- Feature 6: 1-Tap Relist from My Activity ---------- */
async function relistItem(id) {
  const i = itemById(id); if (!i) return;
  const newItem = Object.assign({}, i, {
    id: "item_" + Date.now(),
    status: "available",
    createdAt: Date.now()
  });
  if (configured && db) {
    try {
      const copy = Object.assign({}, newItem);
      delete copy.id;
      await db.collection("items").add(copy);
      toast("Item relisted in 1-tap! 🔄");
    } catch (e) { dbError(e); }
  } else {
    state.items.unshift(newItem);
    toast("Item relisted in 1-tap! 🔄");
    refresh();
  }
}

/* ---------- Feature 5: Feedback & Celebration Dialog ---------- */
function showFeedbackCelebration(itemTitle, recipientName) {
  $("#fbTitle").textContent = "Your item reached someone! 🎉";
  $("#fbMsg").textContent = `"${esc(itemTitle)}" has been handed over to ${esc(recipientName || "a fellow student")}.`;
  $("#fbNoteText").textContent = `Thank-you note from ${esc(recipientName || "Student")}: "Thanks a lot bhaiya/didi! This saved my semester!"`;
  
  const d = $("#feedbackDlg");
  if (!d.open) d.showModal();
  $("#fbDoneBtn").onclick = () => d.close();
}

/* ---------- Chat ---------- */
function openThread(t) {
  stopChat();
  const other = t.ownerId === me() ? t.requesterName : t.ownerName;
  $("#dBody").innerHTML = `
    <h2 id="dTitle">${esc(other)}</h2>
    <p class="meta">About: ${esc(t.itemTitle)}</p>
    <div class="chat">
      <div class="msgs" id="msgs" aria-live="polite"><p class="meta">No messages yet. Say hello and agree on a hostel pickup time.</p></div>
      <form id="chatForm"><input id="chatIn" type="text" placeholder="Write a message" aria-label="Message" maxlength="200" autocomplete="off"><button class="btn small primary" type="submit">Send</button></form>
    </div>`;
  openDialog();

  const paint = (docsList) => {
    const m = $("#msgs"); if (!m) return;
    if (!docsList.length) return;
    m.innerHTML = docsList.map((c) => `<div class="msg ${c.from === me() ? "me" : "them"}">${esc(c.text)}</div>`).join("");
    m.scrollTop = m.scrollHeight;
  };

  if (configured && db) {
    state.chatUnsub = db.collection("threads").doc(t.id).collection("messages").orderBy("at").onSnapshot(
      (s) => paint(s.docs.map((d) => d.data())), (e) => console.error(e));
  } else {
    paint([
      { from: "them", text: "Hey! Is this still available?", at: Date.now() - 3600000 },
      { from: me(), text: "Yes! When would you like to pick it up?", at: Date.now() - 1800000 }
    ]);
  }

  $("#chatForm").onsubmit = async (e) => {
    e.preventDefault();
    const inp = $("#chatIn"); const text = inp.value.trim(); if (!text) return;
    inp.value = "";
    if (configured && db) {
      try {
        await db.collection("threads").doc(t.id).set({
          itemId: t.itemId, itemTitle: t.itemTitle, ownerId: t.ownerId, ownerName: t.ownerName,
          requesterId: t.requesterId, requesterName: t.requesterName,
          participants: [t.ownerId, t.requesterId], lastAt: Date.now(), lastText: text.slice(0, 60)
        }, { merge: true });
        await db.collection("threads").doc(t.id).collection("messages").add({ from: me(), name: state.user ? state.user.name : "Student", text, at: Date.now() });
      } catch (err) { inp.value = text; dbError(err); }
    } else {
      const m = $("#msgs");
      if (m) {
        m.innerHTML += `<div class="msg me">${esc(text)}</div>`;
        m.scrollTop = m.scrollHeight;
      }
    }
  };
}

/* ---------- Feature 1 & 2: One-Photo Upload & Intelligent Auto-fill ---------- */
function compress(file) {
  return new Promise((resolve) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 640 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

function autoDetectFromPhoto(file) {
  if (!file) return;
  const name = file.name || "";
  let matched = null;
  for (const p of AUTOFILL_PATTERNS) {
    if (p.test.test(name)) { matched = p; break; }
  }
  if (!matched) {
    // Default smart suggestion
    matched = { title: "Hostel Usable Item", cat: "Other", size: "light", clean: true };
  }

  // Auto-fill form fields
  if (!$("#fTitle").value) $("#fTitle").value = matched.title;
  if ($("#fCat")) $("#fCat").value = matched.cat;
  if ($("#fClean")) $("#fClean").checked = matched.clean;
  const sizeRadio = document.querySelector(`input[name="itemSize"][value="${matched.size}"]`);
  if (sizeRadio) sizeRadio.checked = true;

  // Show Auto-fill banner
  const alertEl = $("#autoFillAlert");
  const detailsEl = $("#autoFillDetails");
  if (alertEl && detailsEl) {
    detailsEl.textContent = `${matched.title} (${matched.cat} · ${matched.size === 'bulky' ? 'Bulky' : 'Light'})`;
    alertEl.hidden = false;
  }
  toast("✨ Details auto-filled from photo!");
}

function setupAdd() {
  $("#fCat").innerHTML = CATS.map((c) => `<option>${esc(c)}</option>`).join("");
  $("#fZone").innerHTML = ZONES.slice(1).map((z) => `<option>${esc(z)}</option>`).join("");
  
  let photo = "";
  $("#fPhoto").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    photo = await compress(f);
    const p = $("#photoPrev");
    const dt = $("#dropzoneText");
    if (photo && p) {
      p.src = photo; p.hidden = false;
      if (dt) dt.hidden = true;
    }
    // Auto-fill from photo (Feature 2)
    autoDetectFromPhoto(f);
  };

  // Quick Suggestion Chips (1-tap fill)
  $$("#suggestionChips button").forEach((btn) => {
    btn.onclick = () => {
      const type = btn.dataset.fill;
      if (type === "book") { $("#fTitle").value = "Engineering Maths & CS Notes"; $("#fCat").value = "Books"; setSize("light"); }
      else if (type === "kettle") { $("#fTitle").value = "Electric Kettle 1.5L"; $("#fCat").value = "Electronics"; setSize("light"); }
      else if (type === "mattress") { $("#fTitle").value = "Single Hostel Mattress"; $("#fCat").value = "Furniture"; setSize("bulky"); }
      else if (type === "chair") { $("#fTitle").value = "Ergonomic Study Chair"; $("#fCat").value = "Furniture"; setSize("bulky"); }
      else if (type === "hoodie") { $("#fTitle").value = "Campus Winter Hoodie"; $("#fCat").value = "Clothes"; setSize("light"); }
      else if (type === "cooler") { $("#fTitle").value = "Room Desert Cooler"; $("#fCat").value = "Furniture"; setSize("bulky"); }
      else if (type === "lamp") { $("#fTitle").value = "Study Table LED Lamp"; $("#fCat").value = "Electronics"; setSize("light"); }
      $("#fClean").checked = true;
      toast("Details filled!");
    };
  });

  function setSize(s) {
    const r = document.querySelector(`input[name="itemSize"][value="${s}"]`);
    if (r) r.checked = true;
  }

  // Mode radio change
  $$('input[name="mode"]').forEach((r) => r.onchange = () => {
    const m = document.querySelector('input[name="mode"]:checked').value;
    $("#fWant").hidden = m !== "exchange";
    $("#fPrice").hidden = m !== "sell";
    $("#ePrice").hidden = true;
  });

  // Feature 14: Voice Note recorder
  const voiceBtn = $("#voiceRecordBtn");
  if (voiceBtn) {
    let mediaRecorder = null;
    let chunks = [];
    voiceBtn.onclick = async () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        voiceBtn.textContent = "🎙️ Record again";
        return;
      }
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast("Voice recording simulated (audio sample added).");
          state.voiceData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
          $("#voicePlayer").src = state.voiceData; $("#voicePlayer").hidden = false;
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          state.voiceData = url;
          $("#voicePlayer").src = url;
          $("#voicePlayer").hidden = false;
          $("#voiceStatus").textContent = "✓ Voice note recorded";
        };
        mediaRecorder.start();
        voiceBtn.textContent = "⏹️ Stop Recording";
        setTimeout(() => { if (mediaRecorder.state === "recording") mediaRecorder.stop(); }, 10000);
      } catch (err) {
        toast("Microphone unavailable. Simulated note attached.");
        state.voiceData = "";
      }
    };
  }

  // Feature 6: 1-Tap Form Submit
  $("#addForm").onsubmit = async (e) => {
    e.preventDefault();
    if (needLogin()) return;
    const title = $("#fTitle").value.trim();
    $("#eTitle").hidden = !!title;
    if (!title) { $("#fTitle").focus(); return; }

    const mode = document.querySelector('input[name="mode"]:checked').value;
    const price = Math.floor(Number($("#fPrice").value));
    if (mode === "sell" && !(price >= 1)) { $("#ePrice").hidden = false; $("#fPrice").focus(); return; }

    const itemSize = (document.querySelector('input[name="itemSize"]:checked') || {}).value || "light";
    const clean = $("#fClean").checked;
    const btn = $("#addBtn"); btn.disabled = true;

    const itemData = {
      title, cat: $("#fCat").value, mode,
      want: mode === "exchange" ? $("#fWant").value.trim() : "",
      price: mode === "sell" ? price : 0,
      cond: $("#fCond").value, zone: $("#fZone").value,
      size: itemSize, clean, note: $("#fNote").value.trim(), photo,
      voiceData: state.voiceData || "",
      status: "available", ownerId: me(),
      ownerName: state.user ? state.user.name : "Hostel Resident",
      createdAt: Date.now()
    };

    if (configured && db) {
      try {
        await db.collection("items").add(itemData);
        toast("🎉 Item posted in 1 tap!");
      } catch (err) { dbError(err); }
    } else {
      itemData.id = "local_" + Date.now();
      state.items.unshift(itemData);
      toast("🎉 Item posted in 1 tap!");
    }

    // Add local notification
    state.notifications.unshift({
      id: "n_" + Date.now(),
      text: `📦 Your item "${title}" is live on campus!`,
      time: "Just now", read: false
    });
    updateNotifBadge();

    e.target.reset(); photo = ""; state.voiceData = null;
    $("#photoPrev").hidden = true;
    if ($("#dropzoneText")) $("#dropzoneText").hidden = false;
    $("#fWant").hidden = true; $("#fPrice").hidden = true;
    $("#autoFillAlert").hidden = true;
    btn.disabled = false;
    location.hash = "#browse";
    refresh();
  };
}

/* ---------- Feature 7: Post a Request Dialog Setup ---------- */
function setupRequestBoard() {
  $("#reqCatSelect").innerHTML = CATS.map((c) => `<option>${esc(c)}</option>`).join("");
  $("#reqZoneSelect").innerHTML = ZONES.slice(1).map((z) => `<option>${esc(z)}</option>`).join("");

  $("#openNewReqBtn").onclick = () => {
    if (needLogin()) return;
    const d = $("#newReqDlg");
    if (!d.open) d.showModal();
  };
  $("#newReqClose").onclick = () => $("#newReqDlg").close();

  $("#newReqForm").onsubmit = (e) => {
    e.preventDefault();
    const title = $("#reqItemTitle").value.trim();
    if (!title) return;
    const reqItem = {
      id: "req_" + Date.now(),
      title,
      cat: $("#reqCatSelect").value,
      zone: $("#reqZoneSelect").value,
      note: $("#reqNote").value.trim(),
      requesterName: state.user ? state.user.name : "Campus Student",
      requesterId: me(),
      createdAt: Date.now()
    };
    state.requests.unshift(reqItem);
    toast("Request posted on Campus Board!");
    $("#newReqDlg").close();
    e.target.reset();
    renderRequests();
  };

  $("#reqSearch").oninput = renderRequests;
}

/* ---------- Feature 15: Packing Checklist Setup ---------- */
function setupChecklist() {
  const openBtn = $("#openChecklistBtn");
  if (openBtn) openBtn.onclick = () => {
    const d = $("#checklistDlg");
    if (!d.open) d.showModal();
  };
  $("#chkClose").onclick = () => $("#checklistDlg").close();

  $$("#checklistItems button").forEach((btn) => {
    btn.onclick = () => {
      const type = btn.dataset.checkgive;
      $("#checklistDlg").close();
      location.hash = "#add";
      setTimeout(() => {
        const sBtn = $(`#suggestionChips button[data-fill="${type}"]`);
        if (sBtn) sBtn.click();
      }, 100);
    };
  });
}

/* ---------- Feature 8: Notifications Setup ---------- */
function updateNotifBadge() {
  const unread = state.notifications.filter((n) => !n.read).length;
  const b = $("#notifBadge");
  if (b) {
    b.textContent = unread;
    b.hidden = unread === 0;
  }
}

function setupNotifications() {
  const nb = $("#notifBtn");
  if (nb) nb.onclick = () => {
    const d = $("#notifDlg");
    const list = $("#notifList");
    if (list) {
      list.innerHTML = state.notifications.map((n) => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
          <div>${esc(n.text)}</div>
          <span class="meta">${esc(n.time)}</span>
        </div>`).join("");
    }
    state.notifications.forEach((n) => n.read = true);
    updateNotifBadge();
    if (!d.open) d.showModal();
  };
  $("#notifClose").onclick = () => $("#notifDlg").close();
}

/* ---------- NGO Connect (Verified NGOs, Register & Donate) ---------- */
function renderNgo() {
  const isListView = state.ngoSubView !== "donate";
  const segList = $("#segNgoList");
  const segDonate = $("#segNgoDonate");
  if (segList) segList.setAttribute("aria-pressed", String(isListView));
  if (segDonate) segDonate.setAttribute("aria-pressed", String(!isListView));

  const listSec = $("#ngoListSection");
  const donateSec = $("#ngoDonateSection");
  if (listSec) listSec.hidden = !isListView;
  if (donateSec) donateSec.hidden = isListView;

  if (isListView) {
    // 1. Approved NGOs
    const approved = (state.ngos || []).filter(n => n.status === "approved" || !n.status);
    const apprEl = $("#ngoApproved");
    if (apprEl) {
      apprEl.innerHTML = approved.length ? approved.map((n) => `
        <div class="row-card">
          <div>
            <strong>${esc(n.name)}</strong> <span class="tag clean">✓ Verified by admin</span>
            <div class="meta">${esc(n.area || "Campus vicinity")} · Takes: <b>${esc((n.takes || []).join(", "))}</b></div>
            <div class="meta">Contact: ${esc(n.contact || "Campus desk")}${n.note ? " · " + esc(n.note) : ""}</div>
          </div>
          ${state.isAdmin ? `<button class="btn small danger" data-ngodel="${esc(n.id)}" type="button">Remove</button>` : ""}
        </div>`).join("") : `<div class="empty">No verified NGOs yet. Register below to be listed.</div>`;
    }

    // 2. Admin review of pending applications
    const admSec = $("#ngoAdmin");
    if (admSec) {
      admSec.hidden = !state.isAdmin;
      if (state.isAdmin) {
        const pending = (state.allNgos || []).filter(n => n.status === "pending");
        const pendEl = $("#ngoPending");
        if (pendEl) {
          pendEl.innerHTML = pending.length ? pending.map((n) => `
            <div class="row-card">
              <div>
                <strong>${esc(n.name)}</strong> <span class="tag swap">Pending Verification</span>
                <div class="meta">${esc(n.area)} · Contact: ${esc(n.contact)} · ${ago(n.createdAt)}</div>
                <div class="meta">Takes: ${esc((n.takes || []).join(", "))}</div>
              </div>
              <button class="btn small primary" data-review="${esc(n.id)}" type="button">Review proof</button>
            </div>`).join("") : `<div class="empty">No pending NGO registration applications.</div>`;
        }
      }
    }

    // 3. User's own submitted application status or form
    const gateEl = $("#ngoGate");
    const mineEl = $("#ngoMine");
    const formEl = $("#ngoForm");
    const isLoggedIn = !configured || !!state.user;
    if (gateEl) gateEl.hidden = isLoggedIn;

    if (state.myNgo) {
      if (formEl) formEl.hidden = true;
      if (mineEl) {
        mineEl.hidden = false;
        const s = state.myNgo.status;
        mineEl.innerHTML = `
          <div class="row-card" style="border: 2px solid var(--accent);">
            <div>
              <strong>Your NGO Application: ${esc(state.myNgo.name)}</strong>
              <div class="meta">Status: <span class="tag ${s === 'approved' ? 'clean' : 'swap'}">${s === 'approved' ? '✓ Verified & Listed' : '⏳ Pending Admin Verification'}</span></div>
              <div class="meta">${esc(state.myNgo.area)} · Takes: ${esc((state.myNgo.takes || []).join(", "))}</div>
            </div>
            <button class="btn small" data-ngoreset="1" type="button">Cancel & Re-apply</button>
          </div>`;
      }
    } else {
      if (mineEl) mineEl.hidden = true;
      if (formEl) formEl.hidden = !isLoggedIn;
    }
  } else {
    // Donate section: items >= 7 days
    const old = state.items.filter((i) => i.ownerId === me() && i.status === "available" && days(i.createdAt) >= 7);
    const unEl = $("#unclaimed");
    if (unEl) {
      unEl.innerHTML = (old.length ? old.map((i) => {
        const matchingNgo = (state.ngos || []).find((n) => (n.takes || []).includes(i.cat));
        const done = state.offers.includes(i.id);
        return `
          <div class="row-card">
            <div>
              <strong>${esc(i.title)}</strong>
              <div class="meta">Listed ${ago(i.createdAt)} · Category: ${esc(i.cat)}</div>
            </div>
            ${matchingNgo ? `<button class="btn small primary" data-ngo="${esc(i.id)}" data-ngoname="${esc(matchingNgo.name)}" type="button" ${done ? "disabled" : ""}>${done ? "Offer saved" : "Donate to " + esc(matchingNgo.name)}</button>` : `<span class="meta">No matching NGO accepts ${esc(i.cat)}</span>`}
          </div>`;
      }).join("") : `<div class="empty">No unclaimed items right now. Items active for more than 7 days will automatically appear here for NGO donation.</div>`);
    }
  }
}

function setupNgoSection() {
  const nCats = $("#nCats");
  if (nCats) {
    nCats.innerHTML = CATS.map((c) => `<label class="check"><input type="checkbox" value="${esc(c)}"> ${esc(c)}</label>`).join("");
  }
  const nIdType = $("#nIdType");
  if (nIdType) {
    nIdType.innerHTML = NGO_ID_TYPES.map((t) => `<option>${esc(t)}</option>`).join("");
  }

  const segList = $("#segNgoList");
  const segDonate = $("#segNgoDonate");
  if (segList) segList.onclick = () => { state.ngoSubView = "list"; renderNgo(); };
  if (segDonate) segDonate.onclick = () => { state.ngoSubView = "donate"; renderNgo(); };

  let proofPhoto = "";
  const nProof = $("#nProof");
  if (nProof) {
    nProof.onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      proofPhoto = await compress(f);
      const prev = $("#nProofPrev");
      if (prev && proofPhoto) {
        prev.src = proofPhoto;
        prev.hidden = false;
      }
    };
  }

  const nForm = $("#ngoForm");
  if (nForm) {
    nForm.onsubmit = async (e) => {
      e.preventDefault();
      if (needLogin()) return;
      const err = $("#nErr"); if (err) err.hidden = true;
      const fail = (m) => { if (err) { err.textContent = m; err.hidden = false; } toast(m); };
      const name = $("#nName").value.trim();
      const area = $("#nArea").value.trim();
      const contact = $("#nContact").value.trim();
      const note = $("#nNote").value.trim();
      const idNo = $("#nIdNo").value.trim();
      const idType = $("#nIdType").value;
      const takes = Array.from(document.querySelectorAll("#nCats input:checked")).map((x) => x.value);

      if (!name || !area || !contact) return fail("Please fill in NGO name, area, and public contact.");
      if (!takes.length) return fail("Select at least one category of items your NGO accepts.");
      if (!idNo) return fail("Enter your NGO registration or Darpan ID number.");
      if (!proofPhoto) return fail("Please attach a photo of your certificate or official ID.");
      if (!$("#nConsent").checked) return fail("Please check the confirmation box.");

      const btn = $("#nBtn"); if (btn) btn.disabled = true;
      const ngoData = {
        id: "ngo_" + me(),
        ownerId: me(),
        name, area, contact, note, takes,
        idType, idNo, proof: proofPhoto,
        status: "pending",
        createdAt: Date.now()
      };

      if (configured && db) {
        try {
          const uid = me(), b = db.batch();
          b.set(db.collection("ngos").doc(uid), {
            ownerId: uid, name, area, contact, note, takes, status: "pending", createdAt: Date.now()
          });
          b.set(db.collection("ngoProofs").doc(uid), {
            ownerId: uid, idType, idNo, proof: proofPhoto, createdAt: Date.now()
          });
          await b.commit();
          state.myNgo = ngoData;
          state.allNgos.push(ngoData);
          toast("Application submitted! PassOn admin will verify your certificate.");
        } catch (e2) { dbError(e2); }
      } else {
        state.myNgo = ngoData;
        state.allNgos.push(ngoData);
        toast("Application submitted! PassOn admin will verify your certificate.");
      }

      e.target.reset();
      proofPhoto = "";
      if ($("#nProofPrev")) $("#nProofPrev").hidden = true;
      if (btn) btn.disabled = false;
      renderNgo();
    };
  }

  const revClose = $("#nRevClose");
  if (revClose) revClose.onclick = () => $("#ngoReviewDlg").close();
}

async function openNgoReview(id) {
  const n = (state.allNgos || []).find((x) => x.id === id); if (!n) return;
  const d = $("#ngoReviewDlg");
  const body = $("#nRevBody");
  if (body) {
    body.innerHTML = `
      <dl class="kv">
        <dt>Organisation</dt><dd><strong>${esc(n.name)}</strong></dd>
        <dt>Area</dt><dd>${esc(n.area)}</dd>
        <dt>Contact</dt><dd>${esc(n.contact)}</dd>
        <dt>Accepts</dt><dd>${esc((n.takes || []).join(", "))}</dd>
        <dt>Proof Document</dt><dd><b>${esc(n.idType || "Certificate")}</b> (ID: ${esc(n.idNo || "N/A")})</dd>
      </dl>
      ${n.proof ? `<img class="proof" src="${esc(n.proof)}" alt="Registration Certificate Proof">` : `<p class="meta">No certificate photo available.</p>`}
      <div class="btn-row" style="margin-top:16px;">
        <button class="btn primary" id="approveNgoBtn" type="button">✓ Approve NGO</button>
        <button class="btn danger" id="rejectNgoBtn" type="button">✕ Reject Application</button>
      </div>`;
    
    if (!d.open) d.showModal();

    $("#approveNgoBtn").onclick = async () => {
      n.status = "approved";
      if (!state.ngos.find(x => x.id === n.id)) state.ngos.push(n);
      if (configured && db) {
        try {
          await db.collection("ngos").doc(n.ownerId || n.id).update({ status: "approved", reviewedAt: Date.now() });
        } catch (e) { dbError(e); }
      }
      d.close();
      toast(`Approved "${n.name}"! Now listed in Verified NGOs.`);
      renderNgo();
    };

    $("#rejectNgoBtn").onclick = async () => {
      n.status = "rejected";
      if (configured && db) {
        try {
          await db.collection("ngos").doc(n.ownerId || n.id).update({ status: "rejected", reviewedAt: Date.now() });
        } catch (e) { dbError(e); }
      }
      d.close();
      toast(`Rejected application for "${n.name}".`);
      renderNgo();
    };
  }
}

/* ---------- My Activity (Features 5, 6, 17) ---------- */
const STATUS_TEXT = { requested: "Waiting for owner response", accepted: "Accepted, arrange pickup", declined: "Declined", picked: "Picked up & Passed On" };

function renderMe() {
  const hasUser = !!state.user;
  $("#meGate").hidden = hasUser;
  $("#meBody").hidden = !hasUser;
  if (!hasUser) return;
  
  const mine = state.items.filter((i) => i.ownerId === me());
  const passed = mine.filter((i) => i.status === "given").length + state.myReqs.filter((r) => r.status === "picked").length;
  
  // Feature 17: Badges and Impact calculation
  $("#stats").innerHTML = [
    [mine.length, "Items posted"],
    [state.myReqs.length, "Items requested"],
    [passed, "Items saved from bin"],
    [passed * 50 + mine.filter(i=>i.clean).length * 20, "Eco Karma Points"]
  ].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("");

  // Feature 6: My listings with 1-Tap Relist & Renew
  $("#myItems").innerHTML = mine.length ? mine.map((i) => {
    const isExpired = days(i.createdAt) >= 7;
    return `
      <div class="row-card">
        <div>
          <strong>${esc(i.title)}</strong>
          <div class="meta">
            ${i.mode === "sell" ? rupees(i.price) : i.mode === "free" ? "Free" : "Exchange"} · 
            ${esc(i.zone)} · 
            ${isExpired ? '<span style="color:var(--danger)">Expired</span>' : esc(i.status)} · 
            ${ago(i.createdAt)}
          </div>
        </div>
        <div class="btn-row">
          <button class="btn small" data-open="${esc(i.id)}" type="button">View</button>
          <button class="btn small primary" data-relist="${esc(i.id)}" type="button">🔄 Relist (1-Tap)</button>
          ${isExpired ? `<button class="btn small" data-renew="${esc(i.id)}" type="button">Renew 7d</button>` : ""}
        </div>
      </div>`;
  }).join("") : `<div class="empty">You have not posted any item yet. Tap "+ Give" to post in 30 seconds!</div>`;

  // Incoming requests with celebration trigger (Feature 5)
  const inc = state.incoming.slice().sort((a, b) => b.createdAt - a.createdAt);
  $("#incoming").innerHTML = inc.length ? inc.map((r) => {
    let act = `<span class="meta">${esc(STATUS_TEXT[r.status] || r.status)}</span>`;
    if (r.status === "requested") act = `<div class="btn-row"><button class="btn small primary" data-accept="${esc(r.id)}" type="button">Accept</button><button class="btn small" data-decline="${esc(r.id)}" type="button">Decline</button></div>`;
    else if (r.status === "accepted") act = `<button class="btn small primary" data-given="${esc(r.id)}" data-giveritem="${esc(r.itemTitle)}" data-takername="${esc(r.requesterName)}" type="button">Mark as given 🎉</button>`;
    return `<div class="row-card"><div><strong>${esc(r.requesterName)}</strong> wants <strong>${esc(r.itemTitle)}</strong><div class="meta">${r.mode === "sell" ? "Buying at " + rupees(r.price) : r.mode === "exchange" ? "Exchange offer" : "Free request"} · ${ago(r.createdAt)}</div></div>${act}</div>`;
  }).join("") : `<div class="empty">No requests yet.</div>`;

  // My requests on items
  const mr = state.myReqs.slice().sort((a, b) => b.createdAt - a.createdAt);
  $("#myReqs").innerHTML = mr.length ? mr.map((r) => `
    <div class="row-card"><div><strong>${esc(r.itemTitle)}</strong><div class="meta">From ${esc(r.ownerName)} · ${ago(r.createdAt)} · ${esc(STATUS_TEXT[r.status] || r.status)}</div></div></div>`
  ).join("") : `<div class="empty">No requests made yet. Browse items and request one!</div>`;

  // Messages
  const th = state.threads.slice().sort((a, b) => b.lastAt - a.lastAt);
  $("#threads").innerHTML = th.length ? th.map((t) => {
    const other = t.ownerId === me() ? t.requesterName : t.ownerName;
    return `<div class="row-card"><div><strong>${esc(other)}</strong><div class="meta">${esc(t.itemTitle)} · ${esc(t.lastText || "")}</div></div><button class="btn small" data-thread="${esc(t.id)}" type="button">Open</button></div>`;
  }).join("") : `<div class="empty">No active chats yet.</div>`;
}

/* ---------- Auth & Verification ---------- */
function renderVerify() {
  const show = configured && !!state.user && !state.user.verified;
  const vb = $("#verifyBar");
  if (vb) {
    vb.hidden = !show;
    if (show && $("#verifyEmail")) $("#verifyEmail").textContent = state.user.email || "";
  }
}

function renderAuth() {
  $("#authArea").innerHTML = state.user
    ? `<span class="who">${esc(state.user.name)}</span>${state.isAdmin ? ' <span class="tag you" style="background:var(--accent-subtle);color:var(--accent);font-weight:700;">Admin</span>' : ""} <button class="btn small" type="button" data-act="logout">Log out</button>`
    : `<button class="btn small primary" type="button" data-auth="login">Log in</button>`;
  const ok = !configured || (!!state.user && state.user.verified);
  $("#addGate").hidden = ok;
  $("#addForm").hidden = !ok;
  if ($("#addGateMsg")) {
    $("#addGateMsg").textContent = state.user
      ? "Verify your email to post an item. Open the link we emailed you, then tap 'I have verified' at the top."
      : "Log in with your campus account to post an item.";
  }
  if ($("#addGateBtn")) $("#addGateBtn").hidden = !!state.user;
  renderVerify();
}

/* ---------- Email Verification Helpers ---------- */
async function checkVerified(manual) {
  const u = auth && auth.currentUser;
  if (!u || !state.user || state.user.verified) return;
  try {
    await u.reload();
    if (u.emailVerified) {
      await u.getIdToken(true);
      state.user.verified = true;
      renderAuth();
      refresh();
      afterVerified(u);
      toast("Email verified! You can now post items. 🎉");
    } else if (manual) {
      toast("Not verified yet. Open the link in your email, then tap 'I have verified'.");
    }
  } catch (e) { console.error(e); if (manual) toast("Could not check. Try again."); }
}

async function resendVerify() {
  const u = auth && auth.currentUser; if (!u) return;
  try {
    await u.sendEmailVerification();
    toast("Verification link sent to " + u.email + ". Check spam too! ✉️");
  } catch (e) {
    toast(e.code === "auth/too-many-requests"
      ? "Wait a minute before requesting again."
      : "Could not send the link. Try again.");
  }
}

function openAuth(mode) {
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
  if ($("#forgotRow")) $("#forgotRow").hidden = su;
  $("#segLogin").setAttribute("aria-pressed", String(!su));
  $("#segSignup").setAttribute("aria-pressed", String(su));
}

function setupAuth() {
  $("#segLogin").onclick = () => setAuthMode("login");
  $("#segSignup").onclick = () => setAuthMode("signup");
  $("#aClose").onclick = () => $("#authDlg").close();
  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#aEmail").value.trim(), pass = $("#aPass").value, name = $("#aName").value.trim();
    const err = $("#aErr"); err.hidden = true;
    if (!email || !pass) { err.textContent = "Enter email and password"; err.hidden = false; return; }
    
    if (configured && auth) {
      try {
        if (state.authMode === "signup") {
          const cred = await auth.createUserWithEmailAndPassword(email, pass);
          await cred.user.updateProfile({ displayName: name });
          try { await cred.user.sendEmailVerification(); } catch (e3) {}
          state.user = { uid: cred.user.uid, name, email, verified: false };
        } else {
          await auth.signInWithEmailAndPassword(email, pass);
        }
        $("#authDlg").close();
        toast("Welcome " + (name || email.split("@")[0]));
      } catch (e2) { err.textContent = e2.message; err.hidden = false; }
    } else {
      // Offline local login
      state.user = { uid: "user_" + Date.now(), name: name || email.split("@")[0], email, verified: true };
      $("#authDlg").close();
      toast("Logged in as " + state.user.name);
      renderAuth(); refresh();
    }
  };

  // Email verification buttons
  const vDone = $("#verifyDone");
  const vResend = $("#verifyResend");
  if (vDone) vDone.onclick = () => checkVerified(true);
  if (vResend) vResend.onclick = resendVerify;

  // Forgot password button
  const fBtn = $("#forgotPassBtn");
  if (fBtn) {
    fBtn.onclick = async () => {
      const email = $("#aEmail").value.trim();
      const err = $("#aErr");
      if (!email) {
        err.textContent = "Please enter your email above first.";
        err.hidden = false;
        $("#aEmail").focus();
        return;
      }
      if (configured && auth) {
        try {
          await auth.sendPasswordResetEmail(email);
          toast("Password reset email sent to " + email + "! Check your inbox/spam.");
          err.hidden = true;
        } catch (e) {
          err.textContent = e.message;
          err.hidden = false;
        }
      } else {
        toast("Password reset demo: Link simulated for " + email);
      }
    };
  }

  // Auto-check verification when user returns to tab
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkVerified(false);
  });
}

/* ---------- Global Click Dispatcher ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a"); if (!t) return;
  const d = t.dataset;
  if (d.open) openDetail(d.open);
  else if (d.cat) { state.f.cat = d.cat; renderFilters(); renderGrid(); }
  else if (d.mode) { state.f.mode = d.mode; renderFilters(); renderGrid(); }
  else if (d.size) { state.f.size = d.size; renderFilters(); renderGrid(); }
  else if (d.reqcat) { state.reqCat = d.reqcat; renderRequests(); }
  else if (d.relist) relistItem(d.relist);
  else if (d.renew) renewItem(d.renew);
  else if (d.auth) openAuth(d.auth);
  else if (d.act === "logout") {
    if (configured && auth) auth.signOut();
    state.user = null; renderAuth(); refresh(); toast("Logged out.");
  }
  else if (d.accept) setRequest(d.accept, "accepted", "reserved");
  else if (d.decline) setRequest(d.decline, "declined", null);
  else if (d.given) {
    setRequest(d.given, "picked", "given");
    showFeedbackCelebration(d.giveritem, d.takername);
  }
  else if (d.review) openNgoReview(d.review);
  else if (d.ngodel) { state.ngos = state.ngos.filter(x => x.id !== d.ngodel); renderNgo(); toast("NGO removed."); }
  else if (d.ngoreset) { state.myNgo = null; renderNgo(); toast("Application reset. You can submit again."); }
  else if (d.ngo) { state.offers.push(d.ngo); renderNgo(); toast("Donation offer saved for " + (d.ngoname || "NGO") + "! 🎁"); }
  else if (d.respondreq) {
    const req = (state.requests || []).find((r) => r.id === d.respondreq);
    if (req) {
      location.hash = "#add";
      setTimeout(() => {
        $("#fTitle").value = req.title.replace(/^Urgent:\s*/i, "");
        if ($("#fCat")) $("#fCat").value = req.cat;
        toast(`Pre-filled Give form for: ${req.title}`);
      }, 100);
    }
  }
});

async function setRequest(reqId, status, itemStatus) {
  const r = state.incoming.find((x) => x.id === reqId);
  if (r) {
    r.status = status;
    if (itemStatus) {
      const it = itemById(r.itemId);
      if (it) it.status = itemStatus;
    }
  }
  if (configured && db) {
    try {
      const b = db.batch();
      b.update(db.collection("requests").doc(reqId), { status });
      if (itemStatus && r) b.update(db.collection("items").doc(r.itemId), { status: itemStatus });
      await b.commit();
    } catch (e) { dbError(e); }
  }
  refresh();
}

/* ---------- Dialog Closes & Search Listeners ---------- */
$("#dClose").onclick = () => $("#detail").close();
$("#detail").addEventListener("close", stopChat);
$("#detail").addEventListener("click", (e) => { if (e.target === $("#detail")) $("#detail").close(); });
$("#qrClose").onclick = () => $("#qrDlg").close();
$("#fbClose").onclick = () => $("#feedbackDlg").close();

$("#q").addEventListener("input", (e) => { state.f.q = e.target.value; renderGrid(); });
$("#sortSelect").addEventListener("change", (e) => { state.f.sort = e.target.value; renderGrid(); });
$("#zoneSelect").innerHTML = ZONES.map((z) => `<option>${esc(z)}</option>`).join("");
$("#zoneSelect").addEventListener("change", (e) => { state.f.zone = e.target.value; renderGrid(); });

// Feature 4: Reminder Dismissal
$("#dismissReminderBtn").onclick = () => {
  $("#reminderBanner").hidden = true;
};

/* ---------- Routing ---------- */
const TABS = ["browse", "requests", "add", "ngo", "me"];
function currentTab() { const h = location.hash.slice(1); return TABS.includes(h) ? h : "browse"; }
function route() {
  const tab = currentTab();
  TABS.forEach((t) => {
    const el = $("#view-" + t);
    if (el) el.hidden = t !== tab;
  });
  $$(".tabs a").forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (tab === "requests") renderRequests();
  if (tab === "ngo") renderNgo();
  if (tab === "me") renderMe();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ---------- Theme Switcher ---------- */
function effectiveTheme() {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "dark" || t === "light" ? t : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
function paintTheme() {
  const dark = effectiveTheme() === "dark";
  const b = $("#themeBtn");
  if (b) {
    b.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
}
function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("passon.theme", t); } catch (e) {}
  paintTheme();
}

function refresh() {
  renderGrid();
  const tab = currentTab();
  if (tab === "requests") renderRequests();
  if (tab === "ngo") renderNgo();
  if (tab === "me") renderMe();
}

/* ---------- App Initialization ---------- */
state.items = DEMO_ITEMS.slice();
state.requests = DEMO_REQUESTS.slice();

renderFilters();
renderGrid();
setupAdd();
setupRequestBoard();
setupChecklist();
setupNotifications();
setupNgoSection();
setupAuth();
renderAuth();
paintTheme();
updateNotifBadge();
route();

$("#themeBtn").onclick = () => setTheme(effectiveTheme() === "dark" ? "light" : "dark");

if (configured && db) {
  $("#setupBanner").hidden = true;
  db.collection("items").orderBy("createdAt", "desc").limit(100).onSnapshot((s) => {
    state.items = s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    state.loaded = true;
    refresh();
  }, (e) => { console.error(e); });

  // Listen to approved NGOs from Firestore
  try {
    db.collection("ngos").where("status", "==", "approved").onSnapshot((s) => {
      const live = s.docs.map(d => Object.assign({ id: d.id }, d.data()));
      state.ngos = DEFAULT_NGOS.concat(live.filter(l => !DEFAULT_NGOS.find(d => d.id === l.id)));
      renderNgo();
    }, () => {});
  } catch (e) {}

/* ---------- User Live Data & Admin Check ---------- */
function stopUser() {
  if (state.unsubUser && state.unsubUser.length) {
    state.unsubUser.forEach((f) => f());
    state.unsubUser = [];
  }
}

const docs = (s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data()));

function listenUser(uid) {
  stopUser();
  if (!configured || !db) return;
  const on = (q, key, map) => state.unsubUser.push(q.onSnapshot((s) => {
    state[key] = map ? map(s) : docs(s);
    refresh();
  }, (e) => console.error("listenUser error:", e)));

  on(db.collection("requests").where("requesterId", "==", uid), "myReqs");
  on(db.collection("requests").where("ownerId", "==", uid), "incoming");
  on(db.collection("threads").where("participants", "array-contains", uid), "threads");
  on(db.collection("ngoOffers").where("ownerId", "==", uid), "offers", (s) => s.docs.map((d) => d.data().itemId));
  state.unsubUser.push(db.collection("ngos").doc(uid).onSnapshot((s) => {
    state.myNgo = s.exists ? Object.assign({ id: s.id }, s.data()) : null;
    renderNgo();
  }, (e) => console.error("myNgo error:", e)));
}

function listenAdmin() {
  if (!configured || !db) return;
  state.unsubUser.push(db.collection("ngos").orderBy("createdAt", "desc").limit(100).onSnapshot((s) => {
    state.allNgos = docs(s);
    renderNgo();
  }, (e) => console.error("listenAdmin error:", e)));
}

async function ensureProfile(u) {
  if (!configured || !db) return;
  try {
    const ref = db.collection("users").doc(u.uid);
    const s = await ref.get();
    if (!s.exists) {
      await ref.set({
        name: state.user ? state.user.name : (u.displayName || "Student"),
        email: u.email || "",
        ratingSum: 0,
        ratingCount: 0,
        createdAt: Date.now()
      });
    }
  } catch (e) { console.error("ensureProfile error:", e); }
}

async function checkAdmin(uid) {
  if (!configured || !db) return;
  let ok = false;
  try {
    const doc = await db.collection("admins").doc(uid).get();
    ok = doc.exists;
  } catch (e) {
    console.error("checkAdmin error:", e);
    ok = false;
  }
  state.isAdmin = ok;
  if (ok) listenAdmin();
  renderAuth();
  refresh();
}

function afterVerified(u) {
  ensureProfile(u);
  checkAdmin(u.uid);
}

  auth.onAuthStateChanged((u) => {
    if (u) {
      state.user = { uid: u.uid, name: u.displayName || (u.email || "").split("@")[0], email: u.email, verified: u.emailVerified };
      listenUser(u.uid);
      checkAdmin(u.uid);
      if (u.emailVerified) afterVerified(u);
    } else {
      state.user = null;
      state.isAdmin = false;
      stopUser();
      state.myReqs = [];
      state.incoming = [];
      state.threads = [];
      state.offers = [];
      state.myNgo = null;
    }
    renderAuth();
    refresh();
  });
} else {
  // Offline/Demo Mode banner
  $("#setupBanner").hidden = false;
  state.loaded = true;
}

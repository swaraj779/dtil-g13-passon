"use strict";
/* PassOn prototype: all data is sample data held in the browser. No backend. */

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

const SEED = [
  { id: 1, title: "Study table with one drawer", cat: "Furniture", mode: "free", cond: "Good", zone: "Hostel A common room", owner: "Rohan P.", rating: 4.6, days: 1, clean: true, note: "Needs two people to carry" },
  { id: 2, title: "Engineering Mathematics notes, sem 1 and 2", cat: "Books", mode: "free", cond: "Like new", zone: "Library entrance", owner: "Meera K.", rating: 4.9, days: 0, clean: true, note: "Handwritten, with solved problems" },
  { id: 3, title: "Winter jacket, size M", cat: "Clothes", mode: "exchange", want: "A half-sleeve hoodie", cond: "Good", zone: "Girls hostel lobby", owner: "Anjali S.", rating: 4.4, days: 2, clean: true, note: "Washed and dry-cleaned" },
  { id: 4, title: "Single mattress, 4 inch", cat: "Furniture", mode: "free", cond: "Worn but usable", zone: "Hostel B common room", owner: "Kunal D.", rating: 4.1, days: 3, clean: false, note: "Please check it in person before taking" },
  { id: 5, title: "Electric kettle, 1.5 L", cat: "Utensils", mode: "exchange", want: "A study lamp", cond: "Good", zone: "Hostel A common room", owner: "Sahil M.", rating: 4.7, days: 4, clean: true },
  { id: 6, title: "Scientific calculator", cat: "Electronics", mode: "free", cond: "Good", zone: "Main block gate", owner: "Neha R.", rating: 4.8, days: 1, clean: true, note: "New battery fitted" },
  { id: 7, title: "C Programming textbook", cat: "Books", mode: "exchange", want: "Data Structures book", cond: "Good", zone: "Library entrance", owner: "Aditya B.", rating: 4.5, days: 5, clean: true },
  { id: 8, title: "Bucket and mug set", cat: "Utensils", mode: "free", cond: "Worn but usable", zone: "Hostel B common room", owner: "Vikram T.", rating: 4.0, days: 6, clean: true }
];

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable or full */ } }
};

const state = {
  items: SEED.slice(),
  mine: store.get("passon.mine", null),
  reqs: store.get("passon.reqs", []),
  notified: store.get("passon.notified", []),
  chats: {},
  f: { q: "", cat: "All", mode: "all", zone: "All campus" }
};
if (!state.mine) {
  state.mine = [{ id: 101, title: "Old bedsheet set, 2 pairs", cat: "Other", mode: "free", cond: "Good", zone: "Hostel A common room", owner: "You", rating: 0, days: 8, clean: true, note: "Washed" }];
}

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const allItems = () => state.mine.concat(state.items);
const byId = (id) => allItems().find((i) => i.id === id);
const ago = (d) => (d === 0 ? "today" : d === 1 ? "1 day ago" : d + " days ago");

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}
function saveAll() {
  store.set("passon.mine", state.mine.map((i) => Object.assign({}, i, { photo: i.photo && i.photo.length < 150000 ? i.photo : undefined })));
  store.set("passon.reqs", state.reqs);
  store.set("passon.notified", state.notified);
}

/* ---------- Browse ---------- */
function chip(label, pressed, attr) {
  return `<button type="button" class="chip" ${attr} aria-pressed="${pressed}">${esc(label)}</button>`;
}
function renderFilters() {
  $("#catChips").innerHTML = ["All"].concat(CATS).map((c) => chip(c, state.f.cat === c, `data-cat="${esc(c)}"`)).join("");
  $("#modeChips").innerHTML = [["all", "Free and exchange"], ["free", "Free only"], ["exchange", "Exchange only"]]
    .map(([v, l]) => chip(l, state.f.mode === v, `data-mode="${v}"`)).join("");
}
function thumb(i) {
  const bg = i.photo ? `url(${i.photo})` : CAT_COLORS[i.cat] || CAT_COLORS.Other;
  return `<div class="thumb" style="background-image:${bg}" role="img" aria-label="${esc(i.cat)} item">${i.photo ? "" : esc(i.cat.charAt(0))}</div>`;
}
function tagsFor(i) {
  return `<div class="tags"><span class="tag ${i.mode === "free" ? "free" : "swap"}">${i.mode === "free" ? "Free" : "Exchange"}</span>${i.clean ? '<span class="tag clean">Cleaned</span>' : ""}</div>`;
}
function renderGrid() {
  const { q, cat, mode, zone } = state.f;
  const list = allItems().filter((i) =>
    i.owner !== "You" &&
    (cat === "All" || i.cat === cat) &&
    (mode === "all" || i.mode === mode) &&
    (zone === "All campus" || i.zone === zone) &&
    (!q || (i.title + " " + i.cat).toLowerCase().includes(q.toLowerCase())));
  $("#count").textContent = list.length + (list.length === 1 ? " item" : " items") + (zone === "All campus" ? " across campus" : " near " + zone);
  $("#grid").innerHTML = list.length ? list.map((i) => `
    <button class="card" data-open="${i.id}" type="button">
      ${thumb(i)}
      <div class="card-b">
        ${tagsFor(i)}
        <h3>${esc(i.title)}</h3>
        <span class="meta">${esc(i.zone)} · ${ago(i.days)}</span>
      </div>
    </button>`).join("") : `<div class="empty">Nothing matches yet. Try another category, or clear the search.</div>`;
}

/* ---------- Detail dialog ---------- */
function openDetail(id) {
  const i = byId(id); if (!i) return;
  const requested = state.reqs.find((r) => r.id === id);
  const chat = state.chats[id] || (state.chats[id] = [{ me: false, t: "Hi! Yes, it is still available." }]);
  const mine = i.owner === "You";
  $("#dBody").innerHTML = `
    ${thumb(i)}
    ${tagsFor(i)}
    <h2 id="dTitle">${esc(i.title)}</h2>
    <dl class="kv">
      <dt>Category</dt><dd>${esc(i.cat)}</dd>
      <dt>Condition</dt><dd>${esc(i.cond)}${i.clean ? ", cleaned by owner" : ", not marked as cleaned"}</dd>
      ${i.mode === "exchange" ? `<dt>Wants</dt><dd>${esc(i.want || "Open to offers")}</dd>` : ""}
      <dt>Pickup</dt><dd>${esc(i.zone)}</dd>
      <dt>Listed by</dt><dd>${esc(i.owner)}${i.rating ? ", rated " + i.rating.toFixed(1) + " of 5" : ""}</dd>
      ${i.note ? `<dt>Note</dt><dd>${esc(i.note)}</dd>` : ""}
    </dl>
    ${mine ? `<p class="meta">This is your listing.</p>` : `
    <button class="btn primary" id="reqBtn" type="button" ${requested ? "disabled" : ""}>${requested ? "Requested" : i.mode === "free" ? "Request this item" : "Offer an exchange"}</button>
    <div class="chat">
      <strong>Chat with ${esc(i.owner)}</strong>
      <div class="msgs" id="msgs" aria-live="polite"></div>
      <form id="chatForm"><input id="chatIn" type="text" placeholder="Ask when and where to meet" aria-label="Message" maxlength="120"><button class="btn small primary" type="submit">Send</button></form>
      <small class="meta">Replies are simulated in this prototype.</small>
    </div>`}`;
  const paint = () => { const m = $("#msgs"); if (m) { m.innerHTML = chat.map((c) => `<div class="msg ${c.me ? "me" : "them"}">${esc(c.t)}</div>`).join(""); m.scrollTop = m.scrollHeight; } };
  paint();
  const dlg = $("#detail");
  if (!dlg.open) dlg.showModal();
  const rb = $("#reqBtn");
  if (rb) rb.onclick = () => {
    state.reqs.push({ id, status: "requested" }); saveAll();
    rb.textContent = "Requested"; rb.disabled = true;
    toast("Request sent to " + i.owner);
    renderMe();
  };
  const cf = $("#chatForm");
  if (cf) cf.onsubmit = (e) => {
    e.preventDefault();
    const v = $("#chatIn").value.trim(); if (!v) return;
    chat.push({ me: true, t: v }); $("#chatIn").value = ""; paint();
    setTimeout(() => { chat.push({ me: false, t: "Sounds good. I can meet at " + i.zone + " after 6 pm." }); paint(); }, 900);
  };
}

/* ---------- Add ---------- */
function setupAdd() {
  $("#fCat").innerHTML = CATS.map((c) => `<option>${esc(c)}</option>`).join("");
  $("#fZone").innerHTML = ZONES.slice(1).map((z) => `<option>${esc(z)}</option>`).join("");
  let photo = "";
  $("#fPhoto").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { photo = String(r.result); const p = $("#photoPrev"); p.src = photo; p.hidden = false; };
    r.readAsDataURL(f);
  };
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.onchange = () => {
    $("#fWant").hidden = document.querySelector('input[name="mode"]:checked').value !== "exchange";
  });
  $("#addForm").onsubmit = (e) => {
    e.preventDefault();
    const title = $("#fTitle").value.trim();
    $("#eTitle").hidden = !!title;
    if (!title) { $("#fTitle").focus(); return; }
    const mode = document.querySelector('input[name="mode"]:checked').value;
    state.mine.unshift({
      id: Date.now(), title, cat: $("#fCat").value, mode, want: mode === "exchange" ? $("#fWant").value.trim() : "",
      cond: $("#fCond").value, zone: $("#fZone").value, owner: "You", rating: 0, days: 0,
      clean: $("#fClean").checked, note: $("#fNote").value.trim(), photo
    });
    saveAll();
    e.target.reset(); photo = ""; $("#photoPrev").hidden = true; $("#fWant").hidden = true;
    toast("Item posted. It now shows in My activity.");
    location.hash = "#me";
  };
}

/* ---------- NGO ---------- */
function renderNgo() {
  $("#ngoList").innerHTML = NGOS.map((n) => `
    <div class="row-card"><div><strong>${esc(n.name)}</strong><div class="meta">Takes: ${esc(n.takes.join(", "))} · ${esc(n.note)}</div></div></div>`).join("");
  const old = state.mine.filter((i) => i.days >= 7);
  $("#unclaimed").innerHTML = old.length ? old.map((i) => {
    const ngo = NGOS.find((n) => n.takes.includes(i.cat));
    const done = state.notified.includes(i.id);
    return `<div class="row-card"><div><strong>${esc(i.title)}</strong><div class="meta">Listed ${ago(i.days)}, no taker yet</div></div>
      ${ngo ? `<button class="btn small primary" data-ngo="${i.id}" type="button" ${done ? "disabled" : ""}>${done ? "NGO notified" : "Offer to " + esc(ngo.name)}</button>` : `<span class="meta">No NGO takes this category yet</span>`}</div>`;
  }).join("") : `<div class="empty">None right now. Items without a taker for 7 days will appear here.</div>`;
}

/* ---------- Me ---------- */
function renderMe() {
  const picked = state.reqs.filter((r) => r.status === "picked").length;
  $("#stats").innerHTML = [
    [state.mine.length, "Items you listed"],
    [state.reqs.length, "Requests you made"],
    [picked + state.notified.length, "Items kept out of the bin"]
  ].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("");
  $("#myItems").innerHTML = state.mine.map((i) => `<div class="row-card"><div><strong>${esc(i.title)}</strong><div class="meta">${i.mode === "free" ? "Free" : "Exchange"} · ${esc(i.zone)} · ${ago(i.days)}</div></div><button class="btn small" data-open="${i.id}" type="button">View</button></div>`).join("");
  $("#myReqs").innerHTML = state.reqs.length ? state.reqs.map((r) => {
    const i = byId(r.id); if (!i) return "";
    const rated = r.score ? `<span class="meta">You rated ${r.score} of 5</span>` : `<div class="stars" role="group" aria-label="Rate ${esc(i.owner)}">${[1, 2, 3, 4, 5].map((n) => `<button class="star" type="button" data-rate="${r.id}:${n}" aria-pressed="false" aria-label="${n} star${n > 1 ? "s" : ""}">${n}</button>`).join("")}</div>`;
    return `<div class="row-card"><div><strong>${esc(i.title)}</strong><div class="meta">${r.status === "picked" ? "Picked up from " + esc(i.owner) : "Requested from " + esc(i.owner)}</div></div>
      ${r.status === "picked" ? rated : `<button class="btn small primary" data-pick="${r.id}" type="button">Mark as picked up</button>`}</div>`;
  }).join("") : `<div class="empty">No requests yet. Browse items and request one.</div>`;
}

/* ---------- Events and routing ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a"); if (!t) return;
  if (t.dataset.open) openDetail(Number(t.dataset.open));
  else if (t.dataset.cat) { state.f.cat = t.dataset.cat; renderFilters(); renderGrid(); }
  else if (t.dataset.mode) { state.f.mode = t.dataset.mode; renderFilters(); renderGrid(); }
  else if (t.dataset.pick) { const r = state.reqs.find((x) => x.id === Number(t.dataset.pick)); if (r) { r.status = "picked"; saveAll(); renderMe(); toast("Marked as picked up. Rate the owner below."); } }
  else if (t.dataset.rate) { const [id, n] = t.dataset.rate.split(":").map(Number); const r = state.reqs.find((x) => x.id === id); if (r) { r.score = n; saveAll(); renderMe(); toast("Thanks for rating."); } }
  else if (t.dataset.ngo) { state.notified.push(Number(t.dataset.ngo)); saveAll(); renderNgo(); renderMe(); toast("NGO notified (demo)."); }
});
$("#dClose").onclick = () => $("#detail").close();
$("#detail").addEventListener("click", (e) => { if (e.target === $("#detail")) $("#detail").close(); });
$("#q").addEventListener("input", (e) => { state.f.q = e.target.value; renderGrid(); });
$("#zoneSelect").innerHTML = ZONES.map((z) => `<option>${esc(z)}</option>`).join("");
$("#zoneSelect").addEventListener("change", (e) => { state.f.zone = e.target.value; renderGrid(); });

const TABS = ["browse", "add", "ngo", "me"];
function route() {
  const tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "browse";
  TABS.forEach((t) => { $("#view-" + t).hidden = t !== tab; });
  document.querySelectorAll(".tabs a").forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (tab === "ngo") renderNgo();
  if (tab === "me") renderMe();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

renderFilters(); renderGrid(); setupAdd(); route();

(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const dueTimes = {
    "Fri 8 pm": 1200,
    "Sat 9 am": 1980,
    "Sat 10 am": 2040,
    "Sat 11 am": 2100,
    "Sat noon": 2160,
  };
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
    {
      id: "RQ-221",
      club: "Science Society",
      event: "Saturday outreach demo",
      owner: "Mira Patel",
      pickup: 1995,
      pickupLabel: "Sat 9:15 am",
      due: "Sat 11 am",
      items: ["HDMI projector"],
      pending: true,
      note: "The demo needs a projector from 9:15 to 11 am on Saturday.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
    "Mira Patel",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
      next: "Move to follow-up time",
    },
    {
      time: "Saturday · 10:30 am",
      title: "Follow-up check",
      text: "Check the register for missed return times and decide what needs another follow-up.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 1,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    handover: null,
    activity: [],
    bookings: {},
    editing: false,
    returning: null,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const now = () => [945, 1170, 1980, 2070][s.phase];
  const approved = (r) => !r.pending || Boolean(s.bookings?.[r.id]);
  const held = (id) => s.loans.some(
    (l) => l.asset === id && l.back && l.condition && l.condition !== "Good",
  );
  const followUps = (l) => l.followUps ?? [];
  const deadline = (l) =>
    dueTimes[followUps(l).findLast((event) => event.promise)?.promise ?? l.due];
  const overdue = (l) => !l.back && now() > deadline(l);
  const followUpActions = ["Reminder logged", "Return promise logged", "Escalated to desk lead"];
  let following = null;
  const overlaps = (start, end, otherStart, otherEnd) =>
    start < otherEnd && otherStart < end;
  function reservedForAnother(asset, requestId, start, end) {
    return requests.find((r) =>
      r.id !== requestId && s.bookings?.[r.id] === asset &&
      overlaps(start, end, r.pickup, dueTimes[r.due]),
    );
  }
  function bookingConflict(a, r) {
    if (a.repair || held(a.id)) return "Unavailable for issue";
    const loan = out(a.id);
    if (loan && (now() >= deadline(loan) || now() > dueTimes[loan.due] || deadline(loan) > r.pickup)) {
      return "L-" + loan.num + " · " + (now() > dueTimes[loan.due] ? "Overdue" : "On loan") +
        " · expected " + (followUps(loan).findLast((event) => event.promise)?.promise ?? loan.due);
    }
    const other = reservedForAnother(a.id, r.id, r.pickup, dueTimes[r.due]);
    return other ? "Reserved for " + other.id : "";
  }
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";
  function schedule(r) {
    const unit = s.bookings?.[r.id];
    const candidates = assets.filter((a) => r.items.includes(a.type));
    const review = candidates.map((a) => [a, bookingConflict(a, r)]);
    const selected = unit ? review.find(([a]) => a.id === unit) : null;
    const available = review.filter(([, conflict]) => !conflict);
    return `<section class="handover"><h3>Availability at pickup</h3>
      <p>${esc(r.pickupLabel)} to ${esc(r.due)}. An overdue loan has no reliable release time.</p>
      ${review.map(([a, conflict]) => row(a.id, a.type,
        badge(conflict || (out(a.id) ? "Expected back before pickup" : "Available for this window"), !conflict),
      )).join("")}
      ${selected ? `<p>Reserved unit <strong>${esc(unit)}</strong>${selected[1] && out(unit)?.req !== r.id ?
        " · At risk: " + esc(selected[1]) : ""}</p>` : now() >= dueTimes[r.due] ?
        "<p>The requested window has ended.</p>" : available.length ?
        `<form data-approve data-request="${r.id}">
          <div class="form"><label><span>Unit to reserve</span><select name="asset" required>
          <option value="">Select unit…</option>${opts(available.map(([a]) => [a.id, a.id + " · " + a.model]))}
          </select></label></div><button class="primary" type="submit">Approve and reserve</button>
        </form>` : "<p>Approval blocked. Review again when a projector is available.</p>"}
      </section>`;
  }
  function requestPage() {
    let html = head(
      "Equipment requests",
      "Student Activities Office · approvals and upcoming demand",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        (approved(r) ? " · Approved" : " · Pending approval") + "</small><h3>" +
        r.event +
        "</h3><p>" +
        r.club +
        " · Filed by " +
        r.owner +
        "</p><p><b>Return by</b> " +
        r.due +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items.map((x) => "<li>" + x + "</li>").join("") +
        "</ul><p>" +
        r.note +
        "</p></div>" + (r.pending ? schedule(r) : "");
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club + (r.pickupLabel ? " · " + r.pickupLabel : ""),
            badge(approved(r) ? "Approved" : "Pending approval", approved(r)) +
              " " + btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const returned = s.loans.find((l) => l.asset === a.id && l.back && l.condition && l.condition !== "Good");
      const status = a.repair
        ? "In repair"
        : returned && returned.condition === "Damaged"
          ? "Damaged"
          : returned
            ? "Needs inspection"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin,
        badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  function escalationStatus(l) {
    if (l.back) return followUps(l).length ? "Resolved by return" : "";
    const history = followUps(l);
    const latest = history.at(-1);
    if (!latest) return overdue(l) ? "Overdue · Follow up" : "";
    if (latest.action === "Escalated to desk lead") return "Escalated to desk lead";
    if (overdue(l)) return history.some((event) => event.promise)
      ? "Promise missed · Follow up" : "Overdue · Reminder logged";
    return "Awaiting promised return";
  }
  function escalation(l) {
    const status = escalationStatus(l);
    if (!status) return "";
    const history = followUps(l);
    const lastPromise = history.findLast((event) => event.promise)?.promise;
    const editingFollowUp = following === l.num;
    const promises = Object.keys(dueTimes).filter((key) => dueTimes[key] > now());
    return `<div class="follow-up">
      <p><strong>${esc(status)}</strong>${!l.back && lastPromise ? " · Promised " + esc(lastPromise) : ""}</p>
      ${history.length ? `<details${editingFollowUp ? " open" : ""}>
        <summary>Follow-up history (${history.length})</summary>
        <ol>${history.map(({ phase, action, note, promise }) =>
          `<li><strong>${esc(action)}</strong> · ${esc(shifts[phase].time)}
          ${promise ? " · " + esc(promise) : ""}<p>${esc(note)}</p></li>`,
        ).join("")}</ol>
        ${l.back && l.returnedAt ? "<p>Resolved by return · " + esc(l.returnedAt) + "</p>" : ""}
      </details>` : ""}
      ${l.back ? "" : editingFollowUp ? `<form data-follow-up data-num="${l.num}">
        <div class="form">
          <label><span>Action taken</span><select name="action" required>
            <option value="">Select action…</option>${opts(followUpActions.map((a) => [a, a]))}
          </select></label>
          <label><span>Promised return (for return promises)</span><select name="promise">
            <option value="">Select time…</option>${opts(promises.map((p) => [p, p]))}
          </select></label>
          <label class="full"><span>Who you contacted and what happens next</span>
            <textarea name="note" maxlength="240" rows="2" required></textarea>
          </label>
        </div><p>Record an action taken outside the register.</p>
        <div class="buttons"><button class="primary" type="submit">Save follow-up</button>
          ${btn("Cancel", "cancel-follow-up")}</div>
        <p role="alert" data-form-error></p>
      </form>` : btn("Log follow-up for " + l.asset, "follow-up", l.num)}
    </div>`;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id) && !held(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        "<p>For a scheduled request, use the reserved unit and the return time on its form.</p>" +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.filter(approved).map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          Object.keys(dueTimes).map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown)
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req + " · " + l.who + " · Due " + l.due,
        l.back
          ? badge("Returned · " + (l.condition || "Good"), l.condition === "Good")
          : s.returning === l.num
            ? '<form data-return data-num="' + l.num + '"><label><span>Return condition for ' + esc(l.asset) + '</span><select name="condition" required><option value="">Select condition…</option><option>Good</option><option>Damaged</option><option>Missing accessories</option></select></label><button class="primary" type="submit">Save return</button> ' + btn("Cancel", "cancel-return") + '</form>'
            : btn("Record return", "return", String(l.num)),
      ) + escalation(l);
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    const open = s.loans.filter((l) => !l.back);
    if (s.phase >= 2 && (open.length || s.handover)) {
      html += '<section class="handover"><h3>Open at this desk</h3><p>' + (open.map((l) => esc([l.asset, l.who, 'due ' + l.due, escalationStatus(l)].filter(Boolean).join(' · '))).join('<br>') || 'No outstanding units.') + '</p>';
      if (s.handover) html += '<p class="accepted">Accepted by <b>' + esc(s.handover.owner) + '</b> · Next: ' + esc(s.handover.action) + '</p>';
      else html += '<form data-handover><div class="form"><label><span>Incoming desk employee</span><select name="owner" required><option value="">Select…</option>' + opts(people.map((p) => [p, p])) + '</select></label><label><span>Next action</span><input name="action" required maxlength="120" value="Ask Leela for adapter at 9 am" /></label></div><button class="primary" type="submit">Accept handover</button></form>';
      html += '</section>';
    }
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    html += '<section class="timeline"><h3>Item activity</h3>' + (s.activity.length ? s.activity.slice().reverse().map((a) => '<p><b>' + esc(a.item) + '</b> · ' + esc(a.text) + ' <small>' + esc(a.time) + '</small></p>').join('') : '<p>No item activity recorded yet.</p>') + '</section>';
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        following = null;
        break;
      case "advance":
        if (s.phase < shifts.length - 1) s.phase++;
        following = null;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        following = null;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "cancel-return":
        s.returning = null;
        break;
      case "follow-up": {
        const loan = s.loans.find((l) => l.num === Number(v));
        if (!loan || loan.back || !escalationStatus(loan)) return;
        following = loan.num;
        s.returning = null;
        break;
      }
      case "cancel-follow-up":
        following = null;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        s.returning = l.num;
        following = null;
        break;
      }
    }
    commit();
    if (b.dataset.action === "follow-up") q("[data-follow-up] select")?.focus();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-handover]")) {
      const owner = String(form.get("owner") || "").trim();
      const action = String(form.get("action") || "").trim();
      if (s.phase < 2 || !s.loans.some((l) => !l.back) || !people.includes(owner) || !action || s.handover) return;
      s.handover = { owner, action, time: shifts[s.phase].time };
      commit("Handover accepted by " + owner + ".");
      return;
    }
    if (f.matches("[data-approve]")) {
      const request = getReq(f.dataset.request);
      const unit = getAsset(form.get("asset"));
      if (!request?.pending || approved(request) || now() >= dueTimes[request.due] ||
        !unit || !request.items.includes(unit.type) || bookingConflict(unit, request)) {
        commit("Approval blocked. Check availability and select an eligible unit.");
        return;
      }
      s.bookings[request.id] = unit.id;
      commit(request.id + " approved. " + unit.id + " reserved for " + request.pickupLabel + ".");
      q("[data-page] h2").setAttribute("tabindex", "-1");
      q("[data-page] h2").focus();
      return;
    }
    if (f.matches("[data-follow-up]")) {
      const loan = s.loans.find((l) => l.num === Number(f.dataset.num));
      if (!loan || loan.back || following !== loan.num || !escalationStatus(loan)) return;
      const action = form.get("action");
      const note = String(form.get("note") ?? "").trim();
      const promise = action === "Return promise logged" ? form.get("promise") : "";
      const error = f.querySelector("[data-form-error]");
      if (!followUpActions.includes(action) || !note || note.length > 240) {
        error.textContent = "Choose an action and enter a brief follow-up note.";
        return;
      }
      if (action === "Return promise logged" && !(dueTimes[promise] > now())) {
        error.textContent = "Choose a future time for the return promise.";
        return;
      }
      (loan.followUps ??= []).push({ phase: s.phase, action, note, promise });
      following = null;
      commit(action + " for " + loan.asset + ".");
      const button = q(`[data-action="follow-up"][data-val="${loan.num}"]`);
      button?.parentElement.querySelector("details")?.setAttribute("open", "");
      button?.focus();
      return;
    }
    if (f.matches("[data-return]")) {
      const l = s.loans.find((entry) => entry.num === Number(f.dataset.num));
      const condition = String(form.get("condition") || "");
      if (!l || l.back || s.returning !== l.num || !["Good", "Damaged", "Missing accessories"].includes(condition)) return;
      l.back = true;
      l.condition = condition;
      l.returnedAt = shifts[s.phase].time;
      s.returning = null;
      const result = condition === "Good" ? "returned to stock" : condition === "Damaged" ? "marked damaged and held from issue" : "held for accessory inspection";
      s.activity.push({ item: l.asset, text: "Returned by " + l.who + " · condition: " + condition, time: shifts[s.phase].time });
      commit(l.asset + " " + result + ". Slip L-" + l.num + " closed.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !approved(r) || !unit || unit.repair || out(asset) || held(asset) || !people.includes(who))
      return;
    const issueError = r.pending && (s.bookings[r.id] !== asset || due !== r.due)
      ? "Use the unit reserved for this request and its approved return time."
      : !(dueTimes[due] > now())
        ? "Choose a return time after the current desk time."
        : reservedForAnother(asset, req, now(), dueTimes[due])
          ? "This loan overlaps a reservation. Choose another unit or an earlier return."
          : "";
    if (issueError) {
      q("[data-status]").textContent = issueError;
      return;
    }
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    s.activity.push({ item: asset, text: "Issued to " + who + " on slip L-" + num, time: shifts[s.phase].time });
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    const validBooking = ([id, asset]) => {
      const request = getReq(id);
      const unit = getAsset(asset);
      return request?.pending && unit && !unit.repair && request.items.includes(unit.type);
    };
    const validFollowUp = (event) =>
      event && Number.isInteger(event.phase) && shifts[event.phase] &&
      followUpActions.includes(event.action) && typeof event.note === "string" &&
      (event.action === "Return promise logged" ? Object.hasOwn(dueTimes, event.promise) : event.promise === "");
    if (
      !d ||
      d.version !== 1 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      (d.handover !== null && d.handover !== undefined && (!people.includes(d.handover.owner) || typeof d.handover.action !== "string")) ||
      (d.activity !== undefined && !Array.isArray(d.activity)) ||
      (d.bookings !== undefined && (!d.bookings || typeof d.bookings !== "object" ||
        Array.isArray(d.bookings) || !Object.entries(d.bookings).every(validBooking))) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l && getReq(l.req) && getAsset(l.asset) && Number.isInteger(l.num) &&
          (l.followUps === undefined || (Array.isArray(l.followUps) && l.followUps.every(validFollowUp))),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
      activity: Array.isArray(d.activity) ? d.activity.map((a) => ({ ...a })) : [],
      handover: d.handover || null,
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();

import { useState, useEffect } from "react";

const TRAINERS = [
  { id: 1, name: "Sofia Martinez", state: "California", pin: "1234" },
  { id: 2, name: "James Okafor", state: "Texas", pin: "2345" },
  { id: 3, name: "Priya Chen", state: "New York", pin: "3456" },
  { id: 4, name: "Dana Whitfield", state: "Florida", pin: "4567" },
];

const CHECKLIST_ITEMS = [
  { id: "c1", label: "Venue unlocked & inspected" },
  { id: "c2", label: "Equipment sanitized & set up" },
  { id: "c3", label: "Music / audio system checked" },
  { id: "c4", label: "Waiver forms available for new clients" },
  { id: "c5", label: "First-aid kit accessible" },
  { id: "c6", label: "Class plan reviewed" },
  { id: "c7", label: "Post-class space cleaned & reset" },
  { id: "c8", label: "Lost & found checked" },
];

const SAMPLE_STUDENTS = [
  "Aaliyah Brooks", "Ben Torres", "Carmen Silva", "Derek Nguyen",
  "Elena Russo", "Finn McCarthy", "Grace Kim", "Hector Vega",
  "Isla Peterson", "Jonas Webb",
];

const CONTENT_TYPES = ["Class Recap", "Progress Photo", "Member Spotlight", "Tips & Techniques", "Announcement"];

function useStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  const save = (v) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, save];
}

const formatDate = () => new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const formatTime = (ts) => new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const weekKey = () => { const d = new Date(); const jan = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-W${Math.ceil(((d - jan) / 86400000 + jan.getDay() + 1) / 7)}`; };

export default function PilatesPortal() {
  const [screen, setScreen] = useState("login"); // login | dashboard | checklist | attendance | content | summary | admin
  const [trainer, setTrainer] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loginTime, setLoginTime] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [attendance, setAttendance] = useState({});
  const [newStudent, setNewStudent] = useState("");
  const [students, setStudents] = useState(SAMPLE_STUDENTS);
  const [content, setContent] = useState({ type: CONTENT_TYPES[0], title: "", body: "", file: null });
  const [logs, setLogs] = useStorage("pilates_logs", []);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const [tab, setTab] = useState("login");
  const [submitted, setSubmitted] = useState(false);
  const [contentSubmitted, setContentSubmitted] = useState(false);

  const handleSelectTrainer = (t) => { setSelectedTrainer(t); setPinInput(""); setPinError(""); };

  const handleLogin = () => {
    if (!selectedTrainer) return;
    if (pinInput === selectedTrainer.pin) {
      setTrainer(selectedTrainer);
      const ts = Date.now();
      setLoginTime(ts);
      setChecklist({});
      setAttendance({});
      setContent({ type: CONTENT_TYPES[0], title: "", body: "", file: null });
      setSubmitted(false);
      setContentSubmitted(false);
      setScreen("dashboard");
    } else {
      setPinError("Incorrect PIN. Try again.");
    }
  };

  const checklistDone = CHECKLIST_ITEMS.every(i => checklist[i.id]);
  const attendanceCount = Object.values(attendance).filter(Boolean).length;

  const handleFinish = () => {
    const log = {
      id: Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      state: trainer.state,
      week: weekKey(),
      loginTime,
      logoutTime: Date.now(),
      checklist: { ...checklist },
      attendance: SAMPLE_STUDENTS.concat(Object.keys(attendance).filter(s => !SAMPLE_STUDENTS.includes(s)))
        .filter(s => attendance[s]),
      attendanceCount,
      content: contentSubmitted ? { ...content } : null,
      date: new Date().toISOString(),
    };
    setLogs([log, ...logs]);
    setSubmitted(true);
    setScreen("summary");
  };

  const handleAdminLogin = () => {
    if (adminPin === "0000") { setScreen("admin"); setAdminError(""); }
    else setAdminError("Incorrect admin PIN.");
  };

  // ── SCREENS ──────────────────────────────────────────────────────────────

  if (screen === "summary") return <SummaryScreen trainer={trainer} loginTime={loginTime} checklist={checklist} attendanceCount={attendanceCount} contentSubmitted={contentSubmitted} onLogout={() => { setTrainer(null); setScreen("login"); setSelectedTrainer(null); }} />;

  if (screen === "admin") return <AdminScreen logs={logs} onBack={() => setScreen("login")} />;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0ede8 0%, #e8e2d9 100%)", fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <header style={{ background: "#1a1a18", color: "#e8dcc8", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 16px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #c9a96e, #8b6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 1.5, textTransform: "uppercase" }}>Studio Portal</div>
            <div style={{ fontSize: 11, color: "#a89070", letterSpacing: 2, textTransform: "uppercase" }}>Pilates Trainer Hub</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#a89070", textAlign: "right" }}>
          <div>{formatDate()}</div>
          {trainer && <div style={{ color: "#c9a96e", marginTop: 2 }}>Logged in: {trainer.name}</div>}
        </div>
      </header>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 16px" }}>

        {/* LOGIN SCREEN */}
        {screen === "login" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h1 style={{ fontSize: 28, color: "#1a1a18", letterSpacing: 2, marginBottom: 6 }}>TRAINER CHECK-IN</h1>
              <p style={{ color: "#7a6a55", fontSize: 14 }}>Select your name, then enter your PIN to begin your session</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
              {TRAINERS.map(t => (
                <button key={t.id} onClick={() => handleSelectTrainer(t)}
                  style={{ padding: "18px 16px", background: selectedTrainer?.id === t.id ? "#1a1a18" : "#fff", color: selectedTrainer?.id === t.id ? "#e8dcc8" : "#1a1a18", border: `2px solid ${selectedTrainer?.id === t.id ? "#c9a96e" : "#ddd6c8"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: selectedTrainer?.id === t.id ? "#c9a96e" : "#9a8a75", marginTop: 3 }}>{t.state}</div>
                </button>
              ))}
            </div>

            {selectedTrainer && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: "#7a6a55", marginBottom: 14, textAlign: "center" }}>Enter PIN for <strong>{selectedTrainer.name}</strong></div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
                  <input value={pinInput} onChange={e => { setPinInput(e.target.value); setPinError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()}
                    type="password" maxLength={6} placeholder="••••"
                    style={{ padding: "12px 20px", fontSize: 22, letterSpacing: 8, textAlign: "center", border: "2px solid #ddd6c8", borderRadius: 8, width: 140, outline: "none" }} />
                  <button onClick={handleLogin}
                    style={{ padding: "12px 28px", background: "#1a1a18", color: "#e8dcc8", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", letterSpacing: 1 }}>
                    CHECK IN →
                  </button>
                </div>
                {pinError && <div style={{ color: "#c0392b", fontSize: 13, textAlign: "center" }}>{pinError}</div>}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={() => setScreen("adminlogin")} style={{ background: "none", border: "none", color: "#a89070", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Admin / Manager View</button>
            </div>
          </div>
        )}

        {/* ADMIN LOGIN */}
        {screen === "adminlogin" && (
          <div style={{ maxWidth: 400, margin: "60px auto", background: "#fff", borderRadius: 14, padding: 36, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <h2 style={{ textAlign: "center", marginBottom: 8, fontSize: 20 }}>Admin Access</h2>
            <p style={{ color: "#7a6a55", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Default PIN: 0000</p>
            <input value={adminPin} onChange={e => { setAdminPin(e.target.value); setAdminError(""); }} onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
              type="password" placeholder="Admin PIN" style={{ width: "100%", padding: "12px 16px", fontSize: 18, border: "2px solid #ddd6c8", borderRadius: 8, textAlign: "center", letterSpacing: 6, boxSizing: "border-box", marginBottom: 12 }} />
            {adminError && <div style={{ color: "#c0392b", fontSize: 13, textAlign: "center", marginBottom: 10 }}>{adminError}</div>}
            <button onClick={handleAdminLogin} style={{ width: "100%", padding: "12px", background: "#1a1a18", color: "#e8dcc8", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>Enter Admin Dashboard</button>
            <button onClick={() => setScreen("login")} style={{ width: "100%", marginTop: 10, padding: "10px", background: "none", border: "2px solid #ddd6c8", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#7a6a55" }}>← Back</button>
          </div>
        )}

        {/* TRAINER DASHBOARD */}
        {screen === "dashboard" && trainer && (
          <div>
            <div style={{ background: "#1a1a18", color: "#e8dcc8", borderRadius: 14, padding: "24px 28px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "#a89070", letterSpacing: 1, textTransform: "uppercase" }}>Welcome back</div>
                <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 4 }}>{trainer.name}</div>
                <div style={{ fontSize: 13, color: "#c9a96e", marginTop: 3 }}>{trainer.state} · Session started {formatTime(loginTime)}</div>
              </div>
              <div style={{ fontSize: 36 }}>✦</div>
            </div>

            <div style={{ fontSize: 13, color: "#7a6a55", marginBottom: 16, textAlign: "center" }}>Complete all steps below before checking out</div>

            <div style={{ display: "grid", gap: 14 }}>
              {[
                { icon: "☑", label: "Pre-Class Checklist", desc: `${Object.values(checklist).filter(Boolean).length} / ${CHECKLIST_ITEMS.length} completed`, screen: "checklist", done: checklistDone },
                { icon: "👥", label: "Take Attendance", desc: `${attendanceCount} student${attendanceCount !== 1 ? "s" : ""} marked present`, screen: "attendance", done: attendanceCount > 0 },
                { icon: "📸", label: "Submit Weekly Content", desc: contentSubmitted ? "Content submitted ✓" : "Photos, recaps, spotlights", screen: "content", done: contentSubmitted, optional: true },
              ].map(item => (
                <button key={item.screen} onClick={() => setScreen(item.screen)}
                  style={{ background: "#fff", border: `2px solid ${item.done ? "#c9a96e" : "#ddd6c8"}`, borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 18, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 28 }}>{item.done ? "✅" : item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: 16, color: "#1a1a18" }}>{item.label} {item.optional && <span style={{ fontSize: 11, color: "#a89070", fontStyle: "italic" }}>(optional)</span>}</div>
                    <div style={{ fontSize: 13, color: "#7a6a55", marginTop: 3 }}>{item.desc}</div>
                  </div>
                  <div style={{ color: "#c9a96e", fontSize: 20 }}>›</div>
                </button>
              ))}
            </div>

            <button onClick={handleFinish}
              style={{ width: "100%", marginTop: 28, padding: "16px", background: checklistDone && attendanceCount > 0 ? "#1a1a18" : "#ccc", color: "#e8dcc8", border: "none", borderRadius: 10, fontSize: 16, cursor: checklistDone && attendanceCount > 0 ? "pointer" : "not-allowed", letterSpacing: 1 }}>
              {checklistDone && attendanceCount > 0 ? "COMPLETE SESSION & CHECK OUT →" : "Complete checklist & attendance first"}
            </button>
          </div>
        )}

        {/* CHECKLIST SCREEN */}
        {screen === "checklist" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setScreen("dashboard")} style={{ background: "none", border: "2px solid #ddd6c8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14 }}>← Back</button>
              <h2 style={{ fontSize: 22, margin: 0 }}>Pre-Class Checklist</h2>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < CHECKLIST_ITEMS.length - 1 ? "1px solid #f0ece5" : "none", cursor: "pointer" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, border: `2px solid ${checklist[item.id] ? "#c9a96e" : "#ddd6c8"}`, background: checklist[item.id] ? "#c9a96e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {checklist[item.id] && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 15, color: checklist[item.id] ? "#7a6a55" : "#1a1a18", textDecoration: checklist[item.id] ? "line-through" : "none" }}>{item.label}</span>
                  <input type="checkbox" checked={!!checklist[item.id]} onChange={e => setChecklist(p => ({ ...p, [item.id]: e.target.checked }))} style={{ display: "none" }} />
                </label>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: "center", color: "#7a6a55", fontSize: 14 }}>
              {Object.values(checklist).filter(Boolean).length} of {CHECKLIST_ITEMS.length} items complete
            </div>
            {checklistDone && (
              <button onClick={() => setScreen("dashboard")} style={{ width: "100%", marginTop: 16, padding: "14px", background: "#1a1a18", color: "#e8dcc8", border: "none", borderRadius: 10, fontSize: 15, cursor: "pointer" }}>✓ All Done — Back to Dashboard</button>
            )}
          </div>
        )}

        {/* ATTENDANCE SCREEN */}
        {screen === "attendance" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setScreen("dashboard")} style={{ background: "none", border: "2px solid #ddd6c8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14 }}>← Back</button>
              <h2 style={{ fontSize: 22, margin: 0 }}>Attendance — {attendanceCount} Present</h2>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: 16 }}>
              {students.map((s, i) => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < students.length - 1 ? "1px solid #f0ece5" : "none", cursor: "pointer" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, border: `2px solid ${attendance[s] ? "#4caf7d" : "#ddd6c8"}`, background: attendance[s] ? "#4caf7d" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {attendance[s] && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 15 }}>{s}</span>
                  <input type="checkbox" checked={!!attendance[s]} onChange={e => setAttendance(p => ({ ...p, [s]: e.target.checked }))} style={{ display: "none" }} />
                </label>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "#7a6a55", marginBottom: 10 }}>Add a walk-in / new student</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={newStudent} onChange={e => setNewStudent(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newStudent.trim()) { setStudents(p => [...p, newStudent.trim()]); setAttendance(p => ({ ...p, [newStudent.trim()]: true })); setNewStudent(""); } }}
                  placeholder="Full name" style={{ flex: 1, padding: "10px 14px", border: "2px solid #ddd6c8", borderRadius: 8, fontSize: 14 }} />
                <button onClick={() => { if (newStudent.trim()) { setStudents(p => [...p, newStudent.trim()]); setAttendance(p => ({ ...p, [newStudent.trim()]: true })); setNewStudent(""); } }}
                  style={{ padding: "10px 18px", background: "#1a1a18", color: "#e8dcc8", border: "none", borderRadius: 8, cursor: "pointer" }}>Add</button>
              </div>
            </div>
            <button onClick={() => setScreen("dashboard")} style={{ width: "100%", padding: "14px", background: "#1a1a18", color: "#e8dcc8", border: "none", borderRadius: 10, fontSize: 15, cursor: "pointer" }}>✓ Save Attendance — Back to Dashboard</button>
          </div>
        )}

        {/* CONTENT SUBMISSION */}
        {screen === "content" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setScreen("dashboard")} style={{ background: "none", border: "2px solid #ddd6c8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14 }}>← Back</button>
              <h2 style={{ fontSize: 22, margin: 0 }}>Weekly Content Submission</h2>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "#7a6a55", display: "block", marginBottom: 6 }}>CONTENT TYPE</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CONTENT_TYPES.map(t => (
                    <button key={t} onClick={() => setContent(p => ({ ...p, type: t }))}
                      style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${content.type === t ? "#c9a96e" : "#ddd6c8"}`, background: content.type === t ? "#f8f0e0" : "#fff", color: content.type === t ? "#8b6914" : "#555", fontSize: 13, cursor: "pointer" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "#7a6a55", display: "block", marginBottom: 6 }}>TITLE / SUBJECT</label>
                <input value={content.title} onChange={e => setContent(p => ({ ...p, title: e.target.value }))}
                  placeholder="E.g. 'Week 12 — Core Strength Focus'" style={{ width: "100%", padding: "12px 14px", border: "2px solid #ddd6c8", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "#7a6a55", display: "block", marginBottom: 6 }}>DESCRIPTION / NOTES</label>
                <textarea value={content.body} onChange={e => setContent(p => ({ ...p, body: e.target.value }))}
                  placeholder="Share highlights, student wins, challenges, or anything worth noting this week..." rows={5}
                  style={{ width: "100%", padding: "12px 14px", border: "2px solid #ddd6c8", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: "#7a6a55", display: "block", marginBottom: 6 }}>ATTACH PHOTO / FILE</label>
                <div style={{ border: "2px dashed #ddd6c8", borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", background: content.file ? "#f0faf4" : "#fafaf8" }}>
                  <input type="file" accept="image/*,video/*,.pdf" style={{ display: "none" }} id="fileInput" onChange={e => setContent(p => ({ ...p, file: e.target.files[0]?.name || null })) } />
                  <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                    <div style={{ fontSize: 14, color: "#7a6a55" }}>{content.file ? `✓ ${content.file}` : "Click to attach photo, video, or PDF"}</div>
                  </label>
                </div>
              </div>
              <button onClick={() => { if (content.title.trim()) { setContentSubmitted(true); setScreen("dashboard"); } }}
                disabled={!content.title.trim()}
                style={{ width: "100%", padding: "14px", background: content.title.trim() ? "#1a1a18" : "#ccc", color: "#e8dcc8", border: "none", borderRadius: 10, fontSize: 15, cursor: content.title.trim() ? "pointer" : "not-allowed" }}>
                Submit Content →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryScreen({ trainer, loginTime, checklist, attendanceCount, contentSubmitted, onLogout }) {
  const duration = Math.round((Date.now() - loginTime) / 60000);
  return (
    <div style={{ minHeight: "100vh", background: "#1a1a18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 480, width: "100%", margin: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✦</div>
        <h1 style={{ color: "#e8dcc8", fontSize: 28, letterSpacing: 2, marginBottom: 8 }}>SESSION COMPLETE</h1>
        <p style={{ color: "#a89070", marginBottom: 32 }}>Great work, {trainer.name}!</p>
        <div style={{ background: "#252520", borderRadius: 14, padding: 28, marginBottom: 28, textAlign: "left" }}>
          {[
            ["Trainer", trainer.name],
            ["Location", trainer.state],
            ["Session Date", new Date().toLocaleDateString()],
            ["Logged in at", new Date(loginTime).toLocaleTimeString()],
            ["Duration", `~${duration} min`],
            ["Checklist", `${Object.values(checklist).filter(Boolean).length} / 8 items ✓`],
            ["Attendance", `${attendanceCount} student${attendanceCount !== 1 ? "s" : ""} present`],
            ["Content", contentSubmitted ? "Submitted ✓" : "Not submitted this week"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #333", color: "#e8dcc8" }}>
              <span style={{ color: "#a89070", fontSize: 13 }}>{k}</span>
              <span style={{ fontSize: 14 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: "16px", background: "#c9a96e", color: "#1a1a18", border: "none", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }}>SIGN OUT</button>
      </div>
    </div>
  );
}

function AdminScreen({ logs, onBack }) {
  const [filterState, setFilterState] = useState("All");
  const states = ["All", ...new Set(TRAINERS.map(t => t.state))];
  const filtered = filterState === "All" ? logs : logs.filter(l => l.state === filterState);

  return (
    <div style={{ minHeight: "100vh", background: "#f0ede8", fontFamily: "Georgia, serif" }}>
      <header style={{ background: "#1a1a18", color: "#e8dcc8", padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 2 }}>✦ ADMIN DASHBOARD</div>
        <button onClick={onBack} style={{ background: "none", border: "2px solid #555", color: "#a89070", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>← Exit Admin</button>
      </header>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Sessions", val: logs.length },
            { label: "This Week", val: logs.filter(l => l.week === weekKey()).length },
            { label: "Active Trainers", val: new Set(logs.map(l => l.trainerId)).size },
            { label: "Content Pieces", val: logs.filter(l => l.content).length },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 28, fontWeight: "bold", color: "#1a1a18" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#7a6a55", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {states.map(s => (
            <button key={s} onClick={() => setFilterState(s)}
              style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${filterState === s ? "#c9a96e" : "#ddd6c8"}`, background: filterState === s ? "#f8f0e0" : "#fff", color: filterState === s ? "#8b6914" : "#555", fontSize: 13, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#a89070", padding: 60, background: "#fff", borderRadius: 14 }}>No session logs yet. Trainers will appear here after checking in.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {filtered.map(log => (
              <div key={log.id} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 16 }}>{log.trainerName}</div>
                    <div style={{ fontSize: 13, color: "#7a6a55" }}>{log.state} · {new Date(log.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#a89070" }}>
                    <div>In: {formatTime(log.loginTime)}</div>
                    <div>Out: {formatTime(log.logoutTime)}</div>
                    <div>~{Math.round((log.logoutTime - log.loginTime) / 60000)} min</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { label: `${Object.values(log.checklist).filter(Boolean).length}/8 Checklist`, done: Object.values(log.checklist).filter(Boolean).length === 8 },
                    { label: `${log.attendanceCount} Present`, done: log.attendanceCount > 0 },
                    { label: log.content ? `Content: ${log.content.type}` : "No content", done: !!log.content },
                  ].map(tag => (
                    <span key={tag.label} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: tag.done ? "#f0fdf4" : "#fef3e2", color: tag.done ? "#166534" : "#92400e", border: `1px solid ${tag.done ? "#86efac" : "#fcd34d"}` }}>
                      {tag.label}
                    </span>
                  ))}
                </div>
                {log.content && (
                  <div style={{ marginTop: 12, padding: "12px 14px", background: "#f8f5f0", borderRadius: 8, fontSize: 13 }}>
                    <strong>{log.content.type}:</strong> {log.content.title} — <span style={{ color: "#7a6a55" }}>{log.content.body?.substring(0, 80)}{log.content.body?.length > 80 ? "…" : ""}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(ts) { return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }

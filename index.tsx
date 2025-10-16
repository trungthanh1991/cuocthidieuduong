// ==========================================================
//  CUỘC THI ĐIỀU DƯỠNG - React + TypeScript (Fixed Version)
// ==========================================================

// ✅ Đảm bảo TypeScript biết về cấu trúc toàn cục
declare global {
  interface Window {
    APP_CONFIG: {
      TEAMS: string[];
      EXAM_DURATION: number;
      QUESTION_COUNT: number;
      GREETING_DURATION: number;
      USERS: Record<string, { role: 'admin' | 'team'; name: string }>;
    };
    questionBank: { q: string; o: string[]; a: number }[];
  }
}

// ✅ Thêm kiểm tra fallback phòng trường hợp script chưa load
if (!window.APP_CONFIG) {
  console.warn("⚠️ APP_CONFIG chưa tải, khởi tạo tạm để tránh lỗi.");
  window.APP_CONFIG = {
    TEAMS: [],
    EXAM_DURATION: 0,
    QUESTION_COUNT: 0,
    GREETING_DURATION: 0,
    USERS: {}
  };
}
if (!window.questionBank) {
  console.warn("⚠️ questionBank chưa tải, khởi tạo tạm để tránh lỗi.");
  window.questionBank = [];
}

// ==========================================================
//  IMPORTS
// ==========================================================
import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";

// ==========================================================
//  HÀM TIỆN ÍCH
// ==========================================================
const getFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const getInitialScores = () => {
  const defaults: Record<string, any> = {};
  window.APP_CONFIG.TEAMS.forEach(team => {
    defaults[team] = { chaohoi: 0, lythuyet: 0, thuchanh: 0 };
  });
  return getFromStorage("scores", defaults);
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ==========================================================
//  COMPONENTS
// ==========================================================
const AdminScoreForm = ({ section, scores, setScores }) => {
  const handleChange = (team: string, val: string) => {
    const newScores = { ...scores };
    newScores[team][section] = parseInt(val) || 0;
    setScores(newScores);
  };

  return (
    <div className="score-form">
      <h2>Nhập điểm phần thi "{section === "chaohoi" ? "Chào hỏi" : "Thực hành"}"</h2>
      <table>
        <thead>
          <tr><th>Tên Đội</th><th>Điểm</th></tr>
        </thead>
        <tbody>
          {window.APP_CONFIG.TEAMS.map(team => (
            <tr key={team}>
              <td>{team}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={scores[team]?.[section] || 0}
                  onChange={e => handleChange(team, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminGreetingTab = ({ scores, setScores }) => {
  const GREETING_DURATION = window.APP_CONFIG.GREETING_DURATION;
  const [status, setStatus] = useState(() => getFromStorage("greetingTimerStatus", "idle"));
  const [timeLeft, setTimeLeft] = useState(() => getFromStorage("greetingTimeLeft", GREETING_DURATION));

  useEffect(() => {
    saveToStorage("greetingTimerStatus", status);
    saveToStorage("greetingTimeLeft", timeLeft);
  }, [status, timeLeft]);

  useEffect(() => {
    if (status !== "running" || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [status, timeLeft]);

  const handleStart = () => setStatus("running");
  const handlePause = () => setStatus("paused");
  const handleReset = () => {
    setStatus("idle");
    setTimeLeft(GREETING_DURATION);
  };

  return (
    <div>
      <div className="timer-control">
        <div className="hourglass">⏳</div>
        <h3>Đồng hồ bấm giờ (10 phút)</h3>
        <div className="timer-display">{formatTime(timeLeft)}</div>
        <div className="timer-buttons">
          {status === "running" ? (
            <>
              <button className="btn btn-warning" onClick={handlePause}>Tạm dừng</button>
              <button className="btn btn-danger" onClick={handleReset}>Kết thúc thi</button>
            </>
          ) : status === "paused" ? (
            <>
              <button className="btn btn-success" onClick={handleStart}>Tiếp tục</button>
              <button className="btn btn-danger" onClick={handleReset}>Kết thúc thi</button>
            </>
          ) : (
            <button className="btn btn-success" onClick={handleStart}>Bắt đầu thi</button>
          )}
        </div>
      </div>
      <AdminScoreForm section="chaohoi" scores={scores} setScores={setScores} />
    </div>
  );
};

const TheoryExam = ({ user }) => {
  const [examState, setExamState] = useState(() => getFromStorage("examState", { status: "not_started" }));
  const [timeLeft, setTimeLeft] = useState(window.APP_CONFIG.EXAM_DURATION);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (examState.status === "started") {
      const data = getFromStorage(`exam_${user.name}`, null);
      if (data) {
        setQuestions(data.questions);
        setAnswers(data.answers || {});
      }
      const end = examState.endTime;
      const tick = () => {
        const remain = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setTimeLeft(remain);
        if (remain === 0) finish();
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, [examState]);

  const handleAnswer = (qIdx, oIdx) => {
    const newAns = { ...answers, [qIdx]: oIdx };
    setAnswers(newAns);
    const data = getFromStorage(`exam_${user.name}`, {});
    saveToStorage(`exam_${user.name}`, { ...data, answers: newAns });
  };

  const finish = () => {
    let total = 0;
    questions.forEach((q, i) => { if (answers[i] === q.a) total += 100 / window.APP_CONFIG.QUESTION_COUNT; });
    total = Math.round(total);
    setScore(total);
    const all = getFromStorage("scores", {});
    all[user.name].lythuyet = total;
    saveToStorage("scores", all);
  };

  if (score !== null) return <h3>Bạn đã hoàn thành bài thi. Điểm: {score}</h3>;
  if (examState.status === "not_started") return <p>Phần thi lý thuyết chưa bắt đầu.</p>;

  return (
    <div className="theory-container">
      <h3>Thời gian còn lại: {formatTime(timeLeft)}</h3>
      {questions.map((q, i) => (
        <div key={i} className="question-card">
          <p><strong>Câu {i + 1}:</strong> {q.q}</p>
          {q.o.map((opt, j) => (
            <label key={j} style={{ display: "block" }}>
              <input type="radio" checked={answers[i] === j} onChange={() => handleAnswer(i, j)} />
              {opt}
            </label>
          ))}
        </div>
      ))}
      <button className="btn btn-primary" onClick={finish}>Nộp bài</button>
    </div>
  );
};

const TotalScores = ({ scores }) => {
  const teams = window.APP_CONFIG.TEAMS;
  const totals = useMemo(() => {
    return teams.map(t => {
      const s = scores[t] || { chaohoi: 0, lythuyet: 0, thuchanh: 0 };
      return { team: t, total: s.chaohoi + s.lythuyet + s.thuchanh, ...s };
    }).sort((a, b) => b.total - a.total);
  }, [scores]);
  return (
    <div>
      <h2>Bảng tổng điểm</h2>
      <div className="total-scores-grid">
        {totals.map(t => (
          <div key={t.team} className="team-score-card">
            <h3>{t.team}</h3>
            <p>Chào hỏi: {t.chaohoi}</p>
            <p>Lý thuyết: {t.lythuyet}</p>
            <p>Thực hành: {t.thuchanh}</p>
            <p className="total">Tổng: {t.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const submit = e => {
    e.preventDefault();
    if (!onLogin(username)) setError("Tên đăng nhập không tồn tại.");
  };
  return (
    <div className="login-container">
      <h1>Hệ Thống Cuộc Thi</h1>
      <form onSubmit={submit} className="login-form">
        <label>Tên đăng nhập</label>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin, doi1..." required />
        <button className="btn btn-primary">Đăng nhập</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(() => getFromStorage("currentUser", null));
  const [scores, setScores] = useState(getInitialScores);
  const [examState, setExamState] = useState(() => getFromStorage("examState", { status: "not_started" }));
  const [active, setActive] = useState("Chào hỏi");

  useEffect(() => saveToStorage("scores", scores), [scores]);
  useEffect(() => saveToStorage("examState", examState), [examState]);

  const login = username => {
    const u = window.APP_CONFIG.USERS[username];
    if (u) {
      const info = { username, ...u };
      setUser(info);
      saveToStorage("currentUser", info);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const startExam = () => {
    const qs = [...window.questionBank].sort(() => 0.5 - Math.random()).slice(0, window.APP_CONFIG.QUESTION_COUNT);
    window.APP_CONFIG.TEAMS.forEach(t => saveToStorage(`exam_${t}`, { questions: qs, answers: {} }));
    setExamState({ status: "started", endTime: Date.now() + window.APP_CONFIG.EXAM_DURATION * 1000 });
  };

  if (!user) return <LoginScreen onLogin={login} />;

  const renderTab = () => {
    if (user.role === "admin") {
      if (active === "Chào hỏi") return <AdminGreetingTab scores={scores} setScores={setScores} />;
      if (active === "Lý thuyết")
        return examState.status === "not_started"
          ? <button className="btn btn-primary" onClick={startExam}>Bắt đầu thi</button>
          : <p>Kỳ thi đang diễn ra...</p>;
      if (active === "Thực hành") return <AdminScoreForm section="thuchanh" scores={scores} setScores={setScores} />;
      if (active === "Tổng điểm") return <TotalScores scores={scores} />;
    } else {
      if (active === "Chào hỏi") return <h3>Điểm chào hỏi: {scores[user.name]?.chaohoi || 0}</h3>;
      if (active === "Lý thuyết") return <TheoryExam user={user} />;
      if (active === "Thực hành") return <h3>Điểm thực hành: {scores[user.name]?.thuchanh || 0}</h3>;
      if (active === "Tổng điểm") return <TotalScores scores={scores} />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cuộc Thi Điều Dưỡng</h1>
        <div>
          <span>Xin chào, {user.name}</span>
          <button onClick={logout} className="btn btn-logout">Đăng xuất</button>
        </div>
      </header>
      <nav className="tab-nav">
        {["Chào hỏi", "Lý thuyết", "Thực hành", "Tổng điểm"].map(tab => (
          <button key={tab} onClick={() => setActive(tab)} className={`tab-button ${active === tab ? "active" : ""}`}>
            {tab}
          </button>
        ))}
      </nav>
      <main className="tab-content">{renderTab()}</main>
    </div>
  );
};

// ==========================================================
//  KHỞI CHẠY ỨNG DỤNG
// ==========================================================
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

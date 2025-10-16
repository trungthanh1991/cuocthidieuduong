// ==========================================================
//  CUỘC THI ĐIỀU DƯỠNG - React + TypeScript + Firebase Realtime
// ==========================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
// Sửa lỗi: Tập trung tất cả các import của Firebase vào một file duy nhất (`firebase.ts`)
// để đảm bảo service database được khởi tạo và đăng ký đúng cách trước khi sử dụng.
import { db, ref, onValue, set, update } from './firebase';


// ✅ Dữ liệu cấu hình và câu hỏi
const APP_CONFIG = {
  TEAMS: ['Đội 1', 'Đội 2', 'Đội 3', 'Đội 4', 'Đội 5'],
  EXAM_DURATION: 20 * 60, // 20 phút tính bằng giây
  QUESTION_COUNT: 50,
  GREETING_DURATION: 10 * 60, // 10 phút tính bằng giây
  USERS: {
    'admin': { role: 'admin', name: 'Quản trị viên' },
    'doi1': { role: 'team', name: 'Đội 1' },
    'doi2': { role: 'team', name: 'Đội 2' },
    'doi3': { role: 'team', name: 'Đội 3' },
    'doi4': { role: 'team', name: 'Đội 4' },
    'doi5': { role: 'team', name: 'Đội 5' },
  }
};

const questionBank = [
  // ... (Dữ liệu câu hỏi giữ nguyên)
  {
    q: "Rửa tay thường quy theo quy trình của Bộ Y Tế gồm bao nhiêu bước?",
    o: ["4 bước", "5 bước", "6 bước", "7 bước"],
    a: 2 
  },
  {
    q: "Chỉ số nào sau đây KHÔNG thuộc về dấu hiệu sinh tồn?",
    o: ["Mạch", "Nhiệt độ", "Đường huyết mao mạch", "Huyết áp"],
    a: 2
  },
  {
    q: "Tư thế Fowler là tư thế nào?",
    o: ["Nằm ngửa", "Nằm sấp", "Nằm nghiêng", "Nửa nằm nửa ngồi"],
    a: 3
  },
   {
    q: "Kỹ thuật tiêm tĩnh mạch thường được thực hiện ở góc bao nhiêu độ?",
    o: ["90 độ", "45 độ", "15-30 độ", "5-10 độ"],
    a: 2
  },
  {
    q: "Mục đích chính của việc ghi chép hồ sơ bệnh án là gì?",
    o: ["Để làm thủ tục thanh toán viện phí", "Để theo dõi diễn biến bệnh và kết quả điều trị", "Để lưu trữ thông tin cá nhân của bệnh nhân", "Để làm bằng chứng pháp lý khi có kiện tụng"],
    a: 1
  },
  ...Array.from({ length: 95 }, (_, i) => ({
    q: `Đây là nội dung câu hỏi trắc nghiệm mẫu số ${i + 6}?`,
    o: [
      `Phương án trả lời A cho câu ${i + 6}`,
      `Phương án trả lời B cho câu ${i + 6}`,
      `Phương án trả lời C cho câu ${i + 6}`,
      `Phương án trả lời D cho câu ${i + 6}`
    ],
    a: Math.floor(Math.random() * 4),
  })),
];

// ==========================================================
//  HÀM TIỆN ÍCH
// ==========================================================
const getFromStorage = (key, defaultValue) => { // Dùng cho state không cần đồng bộ
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch { return defaultValue; }
};
const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ==========================================================
//  COMPONENTS
// ==========================================================

const CountdownOverlay = ({ startTime }) => {
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    const calculateRemaining = () => Math.max(0, Math.ceil((startTime - Date.now()) / 1000));
    setCountdown(calculateRemaining());
    const timerId = setInterval(() => setCountdown(calculateRemaining()), 1000);
    return () => clearInterval(timerId);
  }, [startTime]);
  if (countdown <= 0) return null;
  return (
    <div className="countdown-overlay">
      <div className="countdown-box">
        <h2>Kỳ thi sẽ bắt đầu sau</h2>
        <div className="countdown-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </div>
        <div className="countdown-timer">{countdown}</div>
      </div>
    </div>
  );
};

const AdminScoreForm = ({ section, scores }) => {
  const handleChange = (team, val) => {
    const newScore = parseInt(val) || 0;
    // Cập nhật điểm cho một đội trong một phần thi cụ thể trên Firebase
    const scoreRef = ref(db, `scores/${team}/${section}`);
    set(scoreRef, newScore);
  };
  return (
    <div className="score-form">
      <h2>Nhập điểm phần thi "{section === "chaohoi" ? "Chào hỏi" : "Thực hành"}"</h2>
      <table>
        <thead><tr><th>Tên Đội</th><th>Điểm</th></tr></thead>
        <tbody>
          {APP_CONFIG.TEAMS.map(team => (
            <tr key={team}>
              <td>{team}</td>
              <td><input type="number" min="0" value={scores[team]?.[section] || 0} onChange={e => handleChange(team, e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminGreetingTab = ({ scores }) => {
  const GREETING_DURATION = APP_CONFIG.GREETING_DURATION;
  // Trạng thái timer giờ cũng được lưu trên Firebase để đồng bộ
  const [timerState, setTimerState] = useState({ status: 'idle', timeLeft: GREETING_DURATION });

  useEffect(() => {
    const timerRef = ref(db, 'greetingTimer');
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimerState(data);
      } else {
        // Khởi tạo nếu chưa có
        set(timerRef, { status: 'idle', timeLeft: GREETING_DURATION });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (timerState.status !== 'running' || timerState.timeLeft <= 0) return;
    const id = setInterval(() => {
      const newTimeLeft = timerState.timeLeft - 1;
      // Chỉ admin mới ghi đè thời gian
      update(ref(db, 'greetingTimer'), { timeLeft: newTimeLeft > 0 ? newTimeLeft : 0 });
    }, 1000);
    return () => clearInterval(id);
  }, [timerState]);

  const updateTimerStatus = (status) => update(ref(db, 'greetingTimer'), { status });
  const handleStart = () => updateTimerStatus('running');
  const handlePause = () => updateTimerStatus('paused');
  const handleReset = () => set(ref(db, 'greetingTimer'), { status: 'idle', timeLeft: GREETING_DURATION });

  return (
    <div>
      <div className="timer-control">
        <div className="hourglass">⏳</div>
        <h3>Đồng hồ bấm giờ (10 phút)</h3>
        <div className="timer-display">{formatTime(timerState.timeLeft)}</div>
        <div className="timer-buttons">
          {timerState.status === "running" ? (
            <><button className="btn btn-warning" onClick={handlePause}>Tạm dừng</button><button className="btn btn-danger" onClick={handleReset}>Kết thúc thi</button></>
          ) : timerState.status === "paused" ? (
            <><button className="btn btn-success" onClick={handleStart}>Tiếp tục</button><button className="btn btn-danger" onClick={handleReset}>Kết thúc thi</button></>
          ) : (
            <button className="btn btn-success" onClick={handleStart}>Bắt đầu thi</button>
          )}
        </div>
      </div>
      <AdminScoreForm section="chaohoi" scores={scores} />
    </div>
  );
};

const TheoryExam = ({ user, examState }) => {
  const [timeLeft, setTimeLeft] = useState(APP_CONFIG.EXAM_DURATION);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  // Lấy đề thi và câu trả lời đã lưu của đội từ Firebase
  useEffect(() => {
    const examDataRef = ref(db, `exams/${user.name}`);
    const unsubscribe = onValue(examDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setQuestions(data.questions || []);
        setAnswers(data.answers || {});
      }
    });
    return () => unsubscribe();
  }, [user.name]);
  
  // Xử lý đếm ngược và nộp bài
  useEffect(() => {
    if (examState.status === "started") {
      const end = examState.endTime;
      const tick = () => {
        const remain = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setTimeLeft(remain);
        if (remain === 0 && score === null) finish();
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, [examState, score]);

  const handleAnswer = (qIdx, oIdx) => {
    const newAns = { ...answers, [qIdx]: oIdx };
    setAnswers(newAns);
    // Lưu câu trả lời lên Firebase ngay lập tức
    const answersRef = ref(db, `exams/${user.name}/answers`);
    set(answersRef, newAns);
  };
  
  const finish = useCallback(() => {
     if (score !== null) return;
     let total = 0;
     questions.forEach((q, i) => { if (answers[i] === q.a) total += 100 / APP_CONFIG.QUESTION_COUNT; });
     total = Math.round(total);
     setScore(total);
     // Cập nhật điểm lý thuyết của đội lên Firebase
     const scoreRef = ref(db, `scores/${user.name}/lythuyet`);
     set(scoreRef, total);
  }, [score, questions, answers, user.name]);

  if (score !== null) return <h3>Bạn đã hoàn thành bài thi. Điểm: {score}</h3>;
  if (examState.status !== "started") return <p>Phần thi lý thuyết chưa bắt đầu. Vui lòng chờ tín hiệu từ ban tổ chức.</p>;

  return (
    <div className="theory-container">
      <h3>Thời gian còn lại: {formatTime(timeLeft)}</h3>
      {questions.map((q, i) => (
        <div key={i} className="question-card">
          <p><strong>Câu {i + 1}:</strong> {q.q}</p>
          {q.o.map((opt, j) => (
            <label key={j} style={{ display: "block" }}>
              <input type="radio" checked={answers[i] === j} onChange={() => handleAnswer(i, j)} /> {opt}
            </label>
          ))}
        </div>
      ))}
      <button className="btn btn-primary" onClick={finish}>Nộp bài</button>
    </div>
  );
};

const TotalScores = ({ scores }) => {
  const totals = useMemo(() => {
    return APP_CONFIG.TEAMS.map(t => {
      const s = scores[t] || { chaohoi: 0, lythuyet: 0, thuchanh: 0 };
      return { team: t, total: (s.chaohoi || 0) + (s.lythuyet || 0) + (s.thuchanh || 0), ...s };
    }).sort((a, b) => b.total - a.total);
  }, [scores]);
  return (
    <div>
      <h2>Bảng tổng điểm</h2>
      <div className="total-scores-grid">
        {totals.map(t => (
          <div key={t.team} className="team-score-card">
            <h3>{t.team}</h3>
            <p>Chào hỏi: <span>{t.chaohoi || 0}</span></p>
            <p>Lý thuyết: <span>{t.lythuyet || 0}</span></p>
            <p>Thực hành: <span>{t.thuchanh || 0}</span></p>
            <p className="total">Tổng: <span>{t.total}</span></p>
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

// Sửa lỗi: Định nghĩa một interface cho `examState` để TypeScript hiểu rằng
// các thuộc tính như `startTime` có thể tồn tại, giải quyết các lỗi truy cập thuộc tính.
interface ExamState {
  status: string;
  startTime?: number;
  endTime?: number;
}

const App = () => {
  const [user, setUser] = useState(() => getFromStorage("currentUser", null));
  const [scores, setScores] = useState({});
  const [examState, setExamState] = useState<ExamState>({ status: "not_started" });
  const [active, setActive] = useState("Chào hỏi");
  const [currentTime, setCurrentTime] = useState(Date.now()); // State để kiểm tra thời gian thực

  // Lắng nghe thay đổi điểm số từ Firebase
  useEffect(() => {
    const scoresRef = ref(db, 'scores');
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      if(data) {
        setScores(data);
      } else {
        // Nếu chưa có điểm, khởi tạo
        const initialScores = {};
        APP_CONFIG.TEAMS.forEach(team => {
          initialScores[team] = { chaohoi: 0, lythuyet: 0, thuchanh: 0 };
        });
        set(scoresRef, initialScores);
      }
    });
    return () => unsubscribe();
  }, []);

  // Lắng nghe thay đổi trạng thái cuộc thi từ Firebase
  useEffect(() => {
    const examStateRef = ref(db, 'examState');
    const unsubscribe = onValue(examStateRef, (snapshot) => {
      const data = snapshot.val();
      if(data){
        setExamState(data);
      } else {
        set(examStateRef, { status: 'not_started' });
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Cập nhật thời gian mỗi giây để giao diện admin tự nhận biết khi hết giờ
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Logic để admin tự động bắt đầu kỳ thi sau countdown
  useEffect(() => {
    if (user?.role === 'admin' && examState.status === 'starting' && examState.startTime) {
      const delay = examState.startTime - Date.now();
      const timerId = setTimeout(() => {
        const qs = [...questionBank].sort(() => 0.5 - Math.random()).slice(0, APP_CONFIG.QUESTION_COUNT);
        // Phát đề cho tất cả các đội
        const examData = {};
        APP_CONFIG.TEAMS.forEach(t => {
          examData[t] = { questions: qs, answers: {} };
        });
        set(ref(db, 'exams'), examData);
        // Cập nhật trạng thái thi
        set(ref(db, 'examState'), { status: "started", endTime: Date.now() + APP_CONFIG.EXAM_DURATION * 1000 });
      }, delay);
      return () => clearTimeout(timerId);
    }
  }, [examState, user]);

  const login = username => {
    const u = APP_CONFIG.USERS[username];
    if (u) {
      const info = { username, ...u };
      setUser(info);
      saveToStorage("currentUser", info); // Vẫn dùng localStorage cho thông tin đăng nhập
      return true;
    }
    return false;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const initiateExamStart = () => {
    set(ref(db, 'examState'), { status: "starting", startTime: Date.now() + 5000 });
  };
  
  const stopExam = () => {
      if (examState.status === 'started' && window.confirm("Bạn có chắc muốn kết thúc phần thi ngay lập tức cho tất cả các đội?")) {
          update(ref(db, 'examState'), { endTime: Date.now() });
      }
  };

  const resetExam = () => {
      if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn BẮT ĐẦU LẠI phần thi lý thuyết không? Hành động này sẽ XÓA TẤT CẢ đề thi, bài làm và điểm lý thuyết hiện tại của các đội.")) {
          set(ref(db, 'examState'), { status: 'not_started' });
          set(ref(db, 'exams'), null);
          const updates = {};
          APP_CONFIG.TEAMS.forEach(team => {
              updates[`/scores/${team}/lythuyet`] = 0;
          });
          update(ref(db), updates);
      }
  };
  
  const renderAdminTheoryTab = () => {
    switch (examState.status) {
      case 'not_started': 
        return <button className="btn btn-primary" onClick={initiateExamStart}>Bắt đầu thi Lý Thuyết</button>;
      case 'starting': 
        return <p>Đang đếm ngược để bắt đầu...</p>;
      case 'started': {
        if (examState.endTime && currentTime > examState.endTime) {
          return (
            <div className="timer-control">
              <p>Kỳ thi đã kết thúc. Các đội đã nộp bài.</p>
              <div className="timer-buttons">
                <button className="btn btn-primary" onClick={resetExam}>Tổ chức lại phần thi</button>
              </div>
            </div>
          );
        }
        return (
          <div className="timer-control">
            <p>Kỳ thi đang diễn ra. Các đội đang làm bài.</p>
            <div className="timer-buttons">
              <button className="btn btn-warning" onClick={stopExam}>Dừng Thi</button>
              <button className="btn btn-danger" onClick={resetExam}>Bắt Đầu Lại</button>
            </div>
          </div>
        );
      }
      default: 
        return (
          <div className="timer-control">
            <p>Trạng thái không xác định. Vui lòng bắt đầu lại để khắc phục.</p>
            <div className="timer-buttons">
              <button className="btn btn-danger" onClick={resetExam}>Bắt Đầu Lại</button>
            </div>
          </div>
        );
    }
  };

  if (!user) return <LoginScreen onLogin={login} />;

  const renderTab = () => {
    if (user.role === "admin") {
      if (active === "Chào hỏi") return <AdminGreetingTab scores={scores} />;
      if (active === "Lý thuyết") return renderAdminTheoryTab();
      if (active === "Thực hành") return <AdminScoreForm section="thuchanh" scores={scores} />;
      if (active === "Tổng điểm") return <TotalScores scores={scores} />;
    } else {
      if (active === "Chào hỏi") return <h3>Điểm chào hỏi: {scores[user.name]?.chaohoi || 0}</h3>;
      if (active === "Lý thuyết") return <TheoryExam user={user} examState={examState} />;
      if (active === "Thực hành") return <h3>Điểm thực hành: {scores[user.name]?.thuchanh || 0}</h3>;
      if (active === "Tổng điểm") return <TotalScores scores={scores} />;
    }
  };

  return (
    <div className="app-container">
      {examState.status === 'starting' && examState.startTime && <CountdownOverlay startTime={examState.startTime} />}
      <header className="app-header">
        <h1>Cuộc Thi Điều Dưỡng</h1>
        <div>
          <span>Xin chào, {user.name}</span>
          <button onClick={logout} className="btn btn-logout">Đăng xuất</button>
        </div>
      </header>
      <nav className="tab-nav">
        {["Chào hỏi", "Lý thuyết", "Thực hành", "Tổng điểm"].map(tab => (
          <button key={tab} onClick={() => setActive(tab)} className={`tab-button ${active === tab ? "active" : ""}`}>{tab}</button>
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
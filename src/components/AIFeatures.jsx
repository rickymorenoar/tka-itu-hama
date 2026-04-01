import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:3001";

// ============================================================
// KOMPONEN: AIChat — Chat bebas tanya materi
// ============================================================
export function AIChat({ onClose }) {
  const [pesan, setPesan] = useState("");
  const [riwayat, setRiwayat] = useState([
    { role: "ai", text: "Halo! Aku tutor AI kamu 👋 Tanya apa aja seputar Matematika, Bahasa Indonesia, atau Penalaran ya!" }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [riwayat]);

  const kirimPesan = async () => {
    if (!pesan.trim() || loading) return;
    const pesanUser = pesan.trim();
    setPesan("");

    const riwayatBaru = [...riwayat, { role: "user", text: pesanUser }];
    setRiwayat(riwayatBaru);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesan: pesanUser,
          riwayat: riwayatBaru.slice(-6).map(r => ({ role: r.role, text: r.text })),
        }),
      });
      const data = await res.json();
      setRiwayat(prev => [...prev, { role: "ai", text: data.balasan || "Maaf, ada kesalahan." }]);
    } catch {
      setRiwayat(prev => [...prev, { role: "ai", text: "⚠️ Gagal terhubung ke server. Pastikan backend jalan." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      kirimPesan();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-violet-500 rounded-xl flex items-center justify-center text-white text-sm">🤖</div>
          <div>
            <p className="text-sm font-bold text-slate-800">Tutor AI</p>
            <p className="text-xs text-green-500 font-medium">● Online</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors text-lg">×</button>
      </div>

      {/* Pesan */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {riwayat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white rounded-tr-sm"
                : "bg-slate-100 text-slate-700 rounded-tl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100">
        <div className="flex gap-2">
          <textarea
            value={pesan}
            onChange={e => setPesan(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya materi pelajaran..."
            rows={1}
            className="flex-1 resize-none bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={kirimPesan}
            disabled={!pesan.trim() || loading}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity shrink-0"
          >
            ➤
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN: AIPembahasan — Penjelasan soal lebih detail
// ============================================================
export function AIPembahasan({ soal, jawabanUser, isBenar }) {
  const [penjelasan, setPenjelasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [sudahDiminta, setSudahDiminta] = useState(false);

  const mintaPenjelasan = async () => {
    if (loading || sudahDiminta) return;
    setLoading(true);
    setSudahDiminta(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/pembahasan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soal: soal.question_text,
          jawaban_benar: soal.correct_answer,
          pembahasan_singkat: soal.pembahasan,
          jawaban_user: jawabanUser,
          category: soal.category,
        }),
      });
      const data = await res.json();
      setPenjelasan(data.penjelasan || "Maaf, gagal mendapat penjelasan.");
    } catch {
      setPenjelasan("⚠️ Gagal terhubung ke server AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {!sudahDiminta ? (
        <button
          onClick={mintaPenjelasan}
          className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-2xl border border-violet-200"
        >
          <span>🤖</span>
          <span>Minta penjelasan AI lebih detail</span>
        </button>
      ) : (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100">
            <span className="text-base">🤖</span>
            <span className="text-sm font-bold text-violet-700">Penjelasan dari AI</span>
            {loading && (
              <div className="flex gap-1 ml-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            )}
          </div>
          {penjelasan && (
            <div className="px-4 py-3">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{penjelasan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// KOMPONEN: AIGenerateSoal — Generate soal baru dari AI
// ============================================================
export function AIGenerateSoal({ onSoalBaru }) {
  const [category, setCategory] = useState("MTK");
  const [difficulty, setDifficulty] = useState("sedang");
  const [topik, setTopik] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate-soal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty, topik }),
      });
      const data = await res.json();
      if (data.success) {
        onSoalBaru(data.soal);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">✨</span>
        <h3 className="font-bold text-slate-800 text-sm">Generate Soal dengan AI</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Kategori */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500">Kategori</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="MTK">📐 Matematika</option>
            <option value="Verbal">📖 Bhs. Indonesia</option>
            <option value="Figural">🧩 Penalaran</option>
          </select>
        </div>

        {/* Kesulitan */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500">Kesulitan</label>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="mudah">😊 Mudah</option>
            <option value="sedang">🤔 Sedang</option>
            <option value="sulit">🔥 Sulit</option>
          </select>
        </div>
      </div>

      {/* Topik opsional */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500">Topik spesifik <span className="font-normal text-slate-400">(opsional)</span></label>
        <input
          value={topik}
          onChange={e => setTopik(e.target.value)}
          placeholder="Contoh: teorema pythagoras, sinonim, pola bilangan..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-bold py-3 rounded-2xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>AI sedang membuat soal...</span>
          </>
        ) : (
          <>✨ Generate Soal Baru</>
        )}
      </button>
    </div>
  );
}

// ============================================================
// KOMPONEN: AISaranBelajar — Analisis & saran setelah kuis
// ============================================================
export function AISaranBelajar({ soalList, hasilValidasi }) {
  const [saran, setSaran] = useState("");
  const [loading, setLoading] = useState(false);
  const [sudahDiminta, setSudahDiminta] = useState(false);

  const mintaSaran = async () => {
    if (loading || sudahDiminta) return;
    setLoading(true);
    setSudahDiminta(true);

    // Hitung hasil per kategori
    const kategori = ["MTK", "Verbal", "Figural"];
    const hasil = kategori.map(kat => {
      const soalKat = soalList.filter(s => s.category === kat);
      const benar = soalKat.filter(s => hasilValidasi[s.id] === true).length;
      return { category: kat, benar, total: soalKat.length };
    });

    const skor = Object.values(hasilValidasi).filter(Boolean).length;

    try {
      const res = await fetch(`${API_BASE}/api/ai/saran-belajar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skor, total: soalList.length, hasil }),
      });
      const data = await res.json();
      setSaran(data.saran || "Maaf, gagal mendapat saran.");
    } catch {
      setSaran("⚠️ Gagal terhubung ke server AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-3xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎯</span>
          <h3 className="font-bold text-slate-800 text-sm">Analisis & Saran Belajar AI</h3>
        </div>

        {!sudahDiminta ? (
          <button
            onClick={mintaSaran}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
          >
            🤖 Minta Analisis & Saran dari AI
          </button>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
            <p className="text-sm text-slate-500">AI sedang menganalisis hasil kuis kamu...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{saran}</p>
          </div>
        )}
      </div>
    </div>
  );
}
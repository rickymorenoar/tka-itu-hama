import { useState, useEffect, useCallback } from "react";
import { AIChat, AIPembahasan, AIGenerateSoal, AISaranBelajar } from "./AIFeatures";

const API_BASE = "http://localhost:3001";

const KATEGORI_CONFIG = {
  MTK:     { emoji: "📐", label: "Matematika",   bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200",   dot: "bg-blue-400"   },
  Verbal:  { emoji: "📖", label: "Bhs. Indonesia", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-400" },
  Figural: { emoji: "🧩", label: "Penalaran",    bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-200", dot: "bg-violet-400"  },
};

const GRADE_CONFIG = {
  A: { emoji: "🏆", label: "Luar Biasa!",    bg: "bg-yellow-50",  text: "text-yellow-600", border: "border-yellow-200" },
  B: { emoji: "🌟", label: "Keren!",         bg: "bg-green-50",   text: "text-green-600",  border: "border-green-200"  },
  C: { emoji: "👍", label: "Cukup Baik",     bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200"   },
  D: { emoji: "📚", label: "Perlu Belajar",  bg: "bg-orange-50",  text: "text-orange-600", border: "border-orange-200" },
  E: { emoji: "💪", label: "Ayo Semangat!",  bg: "bg-red-50",     text: "text-red-600",    border: "border-red-200"    },
};

async function fetchSoal() {
  const res = await fetch(`${API_BASE}/api/quiz/questions`);
  if (!res.ok) throw new Error("Gagal mengambil soal. Pastikan backend jalan di localhost:3001");
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

function getGrade(persen) {
  if (persen >= 90) return "A";
  if (persen >= 80) return "B";
  if (persen >= 70) return "C";
  if (persen >= 60) return "D";
  return "E";
}

export default function TKAQuiz() {
  const [soalList, setSoalList]               = useState([]);
  const [indexSoal, setIndexSoal]             = useState(0);
  const [jawaban, setJawaban]                 = useState({});
  const [hasilValidasi, setHasilValidasi]     = useState({});
  const [tampilPembahasan, setTampilPembahasan] = useState({});
  const [selesai, setSelesai]                 = useState(false);
  const [skor, setSkor]                       = useState(0);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [chatOpen, setChatOpen]               = useState(false);
  const [soalAI, setSoalAI]                   = useState(null);
  const [modeSoalAI, setModeSoalAI]           = useState(false);

  const loadSoal = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSoalList([]);
    setIndexSoal(0);
    setJawaban({});
    setHasilValidasi({});
    setTampilPembahasan({});
    setSelesai(false);
    setSkor(0);
    try {
      const soal = await fetchSoal();
      setSoalList(soal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSoal(); }, []); // eslint-disable-line

  const handlePilihJawaban = useCallback((huruf) => {
    const soal = soalList[indexSoal];
    if (!soal || hasilValidasi[soal.id] !== undefined) return;
    const benar = huruf === soal.correct_answer;
    setJawaban(prev => ({ ...prev, [soal.id]: huruf }));
    setHasilValidasi(prev => ({ ...prev, [soal.id]: benar }));
    if (!benar) setTampilPembahasan(prev => ({ ...prev, [soal.id]: true }));
  }, [soalList, indexSoal, hasilValidasi]);

  const handleBerikutnya = () => {
    if (indexSoal < soalList.length - 1) setIndexSoal(i => i + 1);
    else {
      setSkor(Object.values(hasilValidasi).filter(Boolean).length);
      setSelesai(true);
    }
  };

  const handleSebelumnya = () => {
    if (indexSoal > 0) setIndexSoal(i => i - 1);
  };

  // ─── LOADING ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="text-4xl font-black text-slate-800">
            TKA<span className="text-blue-500">Quiz</span>
            <span className="text-slate-400 font-light text-2xl ml-2">SMP</span>
          </div>
          <div className="flex justify-center gap-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-slate-400 text-sm">Menyiapkan soal...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-sm border border-red-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-3xl">⚠️</div>
          <h2 className="text-slate-800 font-bold text-lg">Gagal Memuat Soal</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
          <button onClick={loadSoal}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-2xl transition-colors text-sm">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ─── HASIL AKHIR ─────────────────────────────────────────────
  if (selesai) {
    const totalSoal = soalList.length;
    const persen    = totalSoal > 0 ? Math.round((skor / totalSoal) * 100) : 0;
    const grade     = getGrade(persen);
    const gc        = GRADE_CONFIG[grade];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-xl mx-auto space-y-5">

          {/* Kartu skor utama */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Top strip warna */}
            <div className={`h-2 w-full ${
              grade === "A" ? "bg-gradient-to-r from-yellow-400 to-orange-400" :
              grade === "B" ? "bg-gradient-to-r from-green-400 to-emerald-400" :
              grade === "C" ? "bg-gradient-to-r from-blue-400 to-cyan-400" :
              grade === "D" ? "bg-gradient-to-r from-orange-400 to-amber-400" :
                              "bg-gradient-to-r from-red-400 to-pink-400"
            }`} />
            <div className="p-8 text-center space-y-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold ${gc.bg} ${gc.text} ${gc.border}`}>
                <span>{gc.emoji}</span>
                <span>{gc.label}</span>
              </div>
              <div>
                <div className="text-7xl font-black text-slate-800">{skor}
                  <span className="text-3xl text-slate-300 font-light">/{totalSoal}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">soal benar</p>
              </div>
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${
                    grade === "A" ? "bg-gradient-to-r from-yellow-400 to-orange-400" :
                    grade === "B" ? "bg-gradient-to-r from-green-400 to-emerald-400" :
                    grade === "C" ? "bg-gradient-to-r from-blue-400 to-cyan-400" :
                    grade === "D" ? "bg-gradient-to-r from-orange-400 to-amber-400" :
                                    "bg-gradient-to-r from-red-400 to-pink-400"
                  }`} style={{ width: `${persen}%` }} />
                </div>
                <p className="text-slate-500 text-sm font-medium">{persen}%</p>
              </div>
            </div>
          </div>

          {/* Statistik per kategori */}
          <div className="grid grid-cols-3 gap-3">
            {["MTK", "Verbal", "Figural"].map(kat => {
              const cfg      = KATEGORI_CONFIG[kat];
              const soalKat  = soalList.filter(s => s.category === kat);
              const benarKat = soalKat.filter(s => hasilValidasi[s.id] === true).length;
              return (
                <div key={kat} className={`bg-white rounded-2xl border ${cfg.border} p-4 text-center shadow-sm`}>
                  <div className="text-2xl mb-1">{cfg.emoji}</div>
                  <div className={`text-xs font-semibold ${cfg.text} mb-2`}>{kat}</div>
                  <div className="text-2xl font-black text-slate-800">{benarKat}</div>
                  <div className="text-xs text-slate-400">dari {soalKat.length}</div>
                </div>
              );
            })}
          </div>

          {/* Review jawaban */}
          <div className="space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest px-1">Review Jawaban</p>
            {soalList.map((soal, idx) => {
              const benar       = hasilValidasi[soal.id];
              const jawabanUser = jawaban[soal.id];
              const cfg         = KATEGORI_CONFIG[soal.category];
              return (
                <div key={soal.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm ${
                    benar === true  ? "border-green-200" :
                    benar === false ? "border-red-200"   : "border-slate-100"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                      benar === true  ? "bg-green-100 text-green-600" :
                      benar === false ? "bg-red-100 text-red-600"     : "bg-slate-100 text-slate-400"
                    }`}>
                      {benar === true ? "✓" : benar === false ? "✗" : "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-slate-400 text-xs">#{idx + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.emoji} {soal.category}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed line-clamp-2">{soal.question_text}</p>
                      {jawabanUser && (
                        <p className="text-xs mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400">Jawaban kamu:</span>
                          <span className={`font-semibold ${benar ? "text-green-600" : "text-red-500"}`}>{jawabanUser}</span>
                          {!benar && <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-400">Benar:</span>
                            <span className="font-semibold text-green-600">{soal.correct_answer}</span>
                          </>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tombol mulai ulang */}
          <button onClick={loadSoal}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-bold py-4 rounded-2xl transition-all shadow-sm text-sm">
            🔄 Mulai Kuis Baru
          </button>

          {/* AI Saran Belajar */}
          <AISaranBelajar soalList={soalList} hasilValidasi={hasilValidasi} />

          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ─── KUIS BERLANGSUNG ────────────────────────────────────────
  if (soalList.length === 0) return null;

  const soal        = soalList[indexSoal];
  const sudahDijawab = hasilValidasi[soal.id] !== undefined;
  const jawabanUser  = jawaban[soal.id];
  const isBenar      = hasilValidasi[soal.id];
  const cfg          = KATEGORI_CONFIG[soal.category] || KATEGORI_CONFIG["Verbal"];
  const progressPct  = ((indexSoal + 1) / soalList.length) * 100;
  const totalBenarNow = Object.values(hasilValidasi).filter(Boolean).length;

  const opsiJawaban = [
    { huruf: "A", teks: soal.option_a },
    { huruf: "B", teks: soal.option_b },
    { huruf: "C", teks: soal.option_c },
    { huruf: "D", teks: soal.option_d },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-lg font-black text-slate-800">
            TKA<span className="text-blue-500">Quiz</span>
            <span className="text-slate-300 font-light text-sm ml-1.5">SMP</span>
          </div>
          {/* Progress teks */}
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="text-slate-400">{indexSoal + 1}</span>
            <span className="text-slate-200">/</span>
            <span className="text-slate-600 font-semibold">{soalList.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Skor live */}
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
              <span className="text-green-500 text-xs">✓</span>
              <span className="text-green-700 font-bold text-sm">{totalBenarNow}</span>
              <span className="text-green-400 text-xs">benar</span>
            </div>
            {/* Tombol AI Chat */}
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors"
            >
              <span className="text-sm">🤖</span>
              <span className="text-violet-700 font-semibold text-xs">Tanya AI</span>
            </button>
          </div>
        </div>
        {/* Progress bar tipis */}
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-gradient-to-r from-blue-400 to-violet-400 transition-all duration-500 rounded-r-full"
            style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      {/* ── KONTEN ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Navigasi dots nomor soal */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {soalList.map((s, idx) => {
            const st = hasilValidasi[s.id];
            return (
              <button key={s.id} onClick={() => setIndexSoal(idx)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200 ${
                  idx === indexSoal
                    ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent scale-110 bg-blue-500 text-white"
                    : st === true  ? "bg-green-100 text-green-700 border border-green-200"
                    : st === false ? "bg-red-100 text-red-600 border border-red-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                }`}>
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Kartu soal */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Top: kategori badge */}
          <div className="px-6 pt-5 pb-0 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">Soal {indexSoal + 1}</span>
          </div>

          {/* Teks soal */}
          <div className="px-6 py-5">
            <p className="text-slate-800 text-[15px] leading-relaxed font-medium">{soal.question_text}</p>
          </div>

          {/* Feedback jawaban */}
          {sudahDijawab && (
            <div className={`mx-6 mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold ${
              isBenar
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              <span className="text-base">{isBenar ? "✅" : "❌"}</span>
              <span>{isBenar ? "Jawaban tepat! Hebat 🎉" : `Jawaban kurang tepat. Benar: ${soal.correct_answer}`}</span>
            </div>
          )}

          {/* Pilihan jawaban */}
          <div className="px-6 pb-6 space-y-2.5">
            {opsiJawaban.map(({ huruf, teks }) => {
              const isBenarOpt = huruf === soal.correct_answer;
              const isPilihan  = huruf === jawabanUser;

              let cardClass = "w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-150 ";

              if (!sudahDijawab) {
                cardClass += "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 active:scale-[0.99] cursor-pointer";
              } else if (isBenarOpt) {
                cardClass += "bg-green-50 border-green-300 text-green-800";
              } else if (isPilihan && !isBenar) {
                cardClass += "bg-red-50 border-red-300 text-red-700";
              } else {
                cardClass += "bg-slate-50 border-slate-100 text-slate-400";
              }

              return (
                <button key={huruf} onClick={() => handlePilihJawaban(huruf)}
                  disabled={sudahDijawab} className={cardClass}>
                  {/* Badge huruf */}
                  <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${
                    !sudahDijawab          ? "bg-white border-slate-300 text-slate-600" :
                    isBenarOpt             ? "bg-green-500 border-green-500 text-white" :
                    isPilihan && !isBenar  ? "bg-red-500 border-red-500 text-white"     :
                                             "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    {huruf}
                  </span>
                  <span className="leading-relaxed pt-0.5">{teks}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pembahasan */}
        {sudahDijawab && (
          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
            <button
              onClick={() => setTampilPembahasan(prev => ({ ...prev, [soal.id]: !prev[soal.id] }))}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>Pembahasan</span>
              </div>
              <span className={`text-amber-400 transition-transform duration-200 ${tampilPembahasan[soal.id] ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {tampilPembahasan[soal.id] && (
              <div className="px-5 pb-5">
                <div className="h-px bg-amber-100 mb-4" />
                <p className="text-slate-600 text-sm leading-relaxed">
                  {soal.pembahasan || "Pembahasan belum tersedia untuk soal ini."}
                </p>
                {/* AI Pembahasan lebih detail */}
                <AIPembahasan
                  soal={soal}
                  jawabanUser={jawabanUser}
                  isBenar={isBenar}
                />
              </div>
            )}
          </div>
        )}

        {/* Tombol navigasi */}
        <div className="flex gap-3 pt-1 pb-6">
          <button onClick={handleSebelumnya} disabled={indexSoal === 0}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
            ← Sebelumnya
          </button>

          {sudahDijawab ? (
            <button onClick={handleBerikutnya}
              className="flex-[2] py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white transition-all active:scale-[0.99] shadow-sm">
              {indexSoal === soalList.length - 1 ? "🏁 Lihat Hasil" : "Lanjut →"}
            </button>
          ) : (
            <button onClick={handleBerikutnya}
              className="flex-[2] py-3.5 rounded-2xl font-medium text-sm bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
              {indexSoal === soalList.length - 1 ? "Selesai" : "Lewati →"}
            </button>
          )}
        </div>

        {/* AI Generate Soal */}
        <div className="pb-4">
          <AIGenerateSoal onSoalBaru={(soalBaru) => {
            setSoalList(prev => {
              const newList = [...prev, { ...soalBaru, id: prev.length + 1 }];
              setTimeout(() => setIndexSoal(newList.length - 1), 100);
              return newList;
            });
          }} />
        </div>

        <div className="h-4" />
      </main>

      {/* AI Chat overlay */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col" style={{ height: "520px" }}>
            <AIChat onClose={() => setChatOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
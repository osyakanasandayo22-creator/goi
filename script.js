// ★ Gemini の API キーはフロントには置かず、Vercel のサーバー側環境変数（GEMINI_API_KEY）で管理します。
//   ここではもう使いません（互換のため空文字だけ定義）。
const GEMINI_API_KEY = "";

// 使用するモデル名
// 通常時は Gemini 3 Flash を使い、制限に達したら Gemini 3.1 Flash Lite に自動フォールバックする
const PRIMARY_MODEL_NAME = "gemini-3-flash-preview";
const FALLBACK_MODEL_NAME = "gemini-3.1-flash-lite";

const runButton = document.getElementById("runButton");
const manualModeButton = document.getElementById("manualModeButton");
const randomTopicButton = document.getElementById("randomTopicButton");
const statusText = document.getElementById("statusText");
const topicMainCategoryList = document.getElementById("topicMainCategoryList");
const topicSubcategoryRow = document.getElementById("topicSubcategoryRow");
const topicSubcategoryList = document.getElementById("topicSubcategoryList");

const topicInput = document.getElementById("topicInput");
const passageField = document.getElementById("passageField");
const passageInput = document.getElementById("passageInput");
const passageDisplay = document.getElementById("passageDisplay");
const answerInput = document.getElementById("answerInput");

const scoreArea = document.getElementById("scoreArea");
const criteriaArea = document.getElementById("criteriaArea");
const feedbackArea = document.getElementById("feedbackArea");
const rewriteArea = document.getElementById("rewriteArea");
const modelAnswerArea = document.getElementById("modelAnswerArea");

// Firebase 関連の要素
const userDisplay = document.getElementById("userDisplay");
const googleLoginButton = document.getElementById("googleLoginButton");
const emailLoginButton = document.getElementById("emailLoginButton");
const logoutButton = document.getElementById("logoutButton");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const historySidebar = document.getElementById("historySidebar");
const sidebarToggleButton = document.getElementById("sidebarToggleButton");
const newNoteButton = document.getElementById("newNoteButton");
const appRoot = document.querySelector(".app");

// お題ジャンル（メイン＋サブ）の定義
const TOPIC_STRUCTURE = {
  logic: {
    label: "論理的な文章",
    description:
      "筆者の考えを論理で追うタイプの説明的な文章。主張・理由・対比・具体例などを整理して読む。",
    sub: {
      claim: {
        label: "筆者の主張",
        description: "文章の結論や意見を読み取る。何を一番言いたいのかを説明させる。",
      },
      reason: {
        label: "理由・根拠",
        description: "なぜその主張になるのか、理由や根拠を整理して説明させる。",
      },
      contrast: {
        label: "対比・比較",
        description: "AとBの違いを説明する構造に注目して、その違いを説明させる。",
      },
      exampleRole: {
        label: "具体例の役割",
        description: "例が何を説明しているのか、その役割を言葉で説明させる。",
      },
    },
  },
  literature: {
    label: "文学的な文章",
    description:
      "感情・描写・テーマを読み取るタイプの文章。物語や随筆などの読解を想定している。",
    sub: {
      emotion: {
        label: "登場人物の心情",
        description: "登場人物の気持ちの変化や内面を、根拠とともに説明させる。",
      },
      scenery: {
        label: "情景描写",
        description: "景色や雰囲気の描写から、どんな意味や気持ちが伝わるかを説明させる。",
      },
      symbol: {
        label: "象徴・比喩",
        description: "物や出来事・比喩表現が何を象徴しているかを説明させる。",
      },
      theme: {
        label: "作品のテーマ",
        description: "作者がその作品全体を通して伝えたいことを説明させる。",
      },
    },
  },
  vocabulary: {
    label: "語彙の意味",
    description:
      "言葉の理解を深めるタイプ。文脈や言い換え、対義語、ニュアンスなどから意味を考える。",
    sub: {
      context: {
        label: "文脈から意味を推測",
        description: "周囲の文章から、その言葉の意味を説明させる。",
      },
      synonym: {
        label: "同義語・言い換え",
        description: "別の表現に置き換えたり、簡単な言葉で言い換えて説明させる。",
      },
      antonym: {
        label: "対義語",
        description: "反対の意味の言葉を挙げ、その違いを含めて説明させる。",
      },
      nuance: {
        label: "ニュアンスの違い",
        description: "似た言葉との微妙な違いを説明させる。",
      },
    },
  },
  trivia: {
    label: "雑学",
    description:
      "短い文章で知識を扱うタイプ。科学・歴史・文化・生活の知恵など、知って楽しい情報を扱う。",
    sub: {
      science: {
        label: "科学・自然",
        description: "科学の仕組みや自然現象について、わかりやすく説明させる。",
      },
      history: {
        label: "歴史・文化",
        description: "歴史的出来事や文化的な事柄について説明させる。",
      },
      life: {
        label: "生活の知恵",
        description: "身近な生活の知恵やコツを、理由も含めて説明させる。",
      },
      trivia: {
        label: "雑学トリビア",
        description: "面白い知識や豆知識を、背景とともに説明させる。",
      },
    },
  },
  summary: {
    label: "要約",
    description:
      "文章全体の内容を短く言い換えるタイプ。重要な情報を残しつつ、簡潔にまとめる練習に使う。",
    sub: {}, // 要約はサブカテゴリなし
  },
};

let currentMainCategory = "logic";
let currentSubCategory = "claim";
let currentTopicMode = "manual"; // "manual" | "ai"
let currentUser = null;
let isLoadingFromHistory = false;

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyB9LiAfYZlkZcGPOgpZi1lEFpKHZdAHllQ",
  authDomain: "goiryoku-5f2eb.firebaseapp.com",
  projectId: "goiryoku-5f2eb",
  storageBucket: "goiryoku-5f2eb.firebasestorage.app",
  messagingSenderId: "609793191837",
  appId: "1:609793191837:web:ae26635e3c7cb8cecc4974",
  measurementId: "G-FFFDMNYSBZ",
};

let firebaseApp = null;
let auth = null;
let db = null;

if (window.firebase) {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
}

function setLoading(loading, message = "") {
  runButton.disabled = loading;
  statusText.textContent = message;
}

function autoResizeTextarea(el) {
  if (!el) return;
  // 本文入力欄は表示専用ブロックとは別に使うので、ここでは高さ調整の対象外
  if (el === passageInput) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function updateRunButtonState() {
  if (!runButton || !topicInput || !answerInput) return;
  const topic = topicInput.value.trim();
  const answer = answerInput.value.trim();
  const shouldDisable = !topic || !answer || currentTopicMode === "ai" && (!topic || !answer);
  runButton.disabled = shouldDisable;
}

function setTopicMode(mode) {
  currentTopicMode = mode;

  const isAi = mode === "ai";

  if (topicInput) {
    topicInput.readOnly = isAi;
  }
  // 本文は AI モードでは表示専用ブロックを使う
  if (passageInput && passageDisplay) {
    if (isAi) {
      passageInput.style.display = "none";
      passageDisplay.style.display = "block";
      passageDisplay.textContent = passageInput.value.trim();
    } else {
      passageInput.style.display = "";
      passageDisplay.style.display = "none";
    }
  } else if (passageInput) {
    passageInput.readOnly = isAi;
  }

  if (manualModeButton) {
    manualModeButton.classList.toggle("btn--toggle-active", !isAi);
  }
  if (randomTopicButton) {
    randomTopicButton.classList.toggle("btn--toggle-active", isAi);
  }

  // モード変更に応じてボタンの有効/無効も更新
  updateRunButtonState();
}

// Firebase 認証 UI 更新
function updateAuthUI(user) {
  if (!userDisplay || !googleLoginButton || !emailLoginButton || !logoutButton) return;

  if (user) {
    const name = user.displayName || user.email || "ログイン中";
    userDisplay.textContent = name;
    googleLoginButton.style.display = "none";
    emailLoginButton.style.display = "none";
    logoutButton.style.display = "inline-flex";
  } else {
    userDisplay.textContent = "未ログイン";
    googleLoginButton.style.display = "inline-flex";
    emailLoginButton.style.display = "inline-flex";
    logoutButton.style.display = "none";
  }
}

// 履歴リストを描画
function renderHistory(docs) {
  if (!historyList || !historyEmpty) return;

  historyList.innerHTML = "";

  if (!docs.length) {
    historyEmpty.style.display = "block";
    return;
  }

  historyEmpty.style.display = "none";

  docs.forEach((doc) => {
    const data = doc.data();
    const item = document.createElement("div");
    item.className = "history__item";

    const createdAt = data.createdAt?.toDate
      ? data.createdAt.toDate()
      : new Date();

    const mainLabel = TOPIC_STRUCTURE[data.mainCategory]?.label || "不明なタイプ";

    const scoreText =
      typeof data.score === "number" ? `${data.score} / 10 点` : "スコア未取得";

    item.innerHTML = `
      <div class="history__item-main">
        <div class="history__item-title">${(data.topic || "お題なし")
          .toString()
          .slice(0, 40)}${(data.topic || "").length > 40 ? "…" : ""}</div>
        <div class="history__item-meta">
          ${createdAt.toLocaleString()}｜${mainLabel}｜${scoreText}
        </div>
      </div>
      <div class="history__item-actions">
        <button class="btn btn--secondary btn--small" data-id="${
          doc.id
        }">削除</button>
      </div>
    `;

    const deleteBtn = item.querySelector("button");
    deleteBtn.addEventListener("click", async () => {
      if (!currentUser || !db) return;
      const ok = window.confirm("この結果を削除しますか？");
      if (!ok) return;
      try {
        await db
          .collection("users")
          .doc(currentUser.uid)
          .collection("sessions")
          .doc(doc.id)
          .delete();
        await loadHistory();
      } catch (e) {
        console.error(e);
        alert("削除中にエラーが発生しました。");
      }
    });

    const mainArea = item.querySelector(".history__item-main");
    if (mainArea) {
      mainArea.addEventListener("click", () => {
        loadSessionDetail(doc.id);
      });
    }

    historyList.appendChild(item);
  });
}

// 履歴の読み込み
async function loadHistory() {
  if (!currentUser || !db || !historyList || !historyEmpty) return;

  try {
    const snap = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("sessions")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    renderHistory(snap.docs);
  } catch (e) {
    console.error(e);
  }
}

// 結果の自動保存
async function saveSession(result) {
  if (!currentUser || !db || !result) return;

  try {
    const doc = {
      topic: topicInput?.value.trim() || "",
      passage: passageInput?.value.trim() || "",
      answer: answerInput?.value.trim() || "",
      score: typeof result.totalScore === "number" ? result.totalScore : null,
      criteria: Array.isArray(result.criteria) ? result.criteria : [],
      modelAnswer: result.modelAnswer || "",
      totalComment: result.totalComment || "",
      mainCategory: currentMainCategory,
      subCategory: currentSubCategory,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("sessions")
      .add(doc);

    // 直後に履歴を更新
    loadHistory();
  } catch (e) {
    console.error("saveSession error", e);
  }
}

// 履歴アイテムから過去の結果を読み込む
async function loadSessionDetail(docId) {
  if (!currentUser || !db) return;

  try {
    isLoadingFromHistory = true;

    const snap = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("sessions")
      .doc(docId)
      .get();

    if (!snap.exists) return;

    const data = snap.data();

    if (topicInput) {
      topicInput.value = data.topic || "";
      topicInput.readOnly = true;
      autoResizeTextarea(topicInput);
    }
    if (passageInput) {
      passageInput.value = data.passage || "";
    }
    if (passageInput && passageDisplay) {
      passageInput.style.display = "none";
      passageDisplay.style.display = "block";
      passageDisplay.textContent = (data.passage || "").toString();
    }
    if (answerInput) {
      answerInput.value = data.answer || "";
      answerInput.readOnly = true;
      autoResizeTextarea(answerInput);
    }

    // 過去の語彙トレ閲覧中はボタン類を無効化して「押せなさそう」にする
    if (runButton) {
      runButton.disabled = true;
    }
    if (manualModeButton) {
      manualModeButton.disabled = true;
    }
    if (randomTopicButton) {
      randomTopicButton.disabled = true;
    }

    const result = {
      totalScore: typeof data.score === "number" ? data.score : null,
      totalComment: data.totalComment || "",
      criteria: Array.isArray(data.criteria) ? data.criteria : [],
      modelAnswer: data.modelAnswer || "",
    };

    renderResult(result, "");
  } catch (e) {
    console.error(e);
    alert("履歴の読み込み中にエラーが発生しました。");
  } finally {
    isLoadingFromHistory = false;
  }
}

// サブカテゴリのボタンを描画
function renderSubcategories() {
  if (!topicSubcategoryList) return;
  const main = TOPIC_STRUCTURE[currentMainCategory];
  if (!main) return;

  topicSubcategoryList.innerHTML = "";
  const entries = Object.entries(main.sub);

  // サブカテゴリがない（要約など）の場合は列ごと非表示
  if (!entries.length) {
    if (topicSubcategoryRow) {
      topicSubcategoryRow.style.display = "none";
    }
    return;
  }

  // サブカテゴリがある場合は行を表示
  if (topicSubcategoryRow) {
    topicSubcategoryRow.style.display = "flex";
  }

  // 現在のサブカテゴリが無効なら、先頭を選ぶ
  if (!main.sub[currentSubCategory]) {
    currentSubCategory = entries[0][0];
  }

  for (const [key, sub] of entries) {
    const btn = document.createElement("button");
    btn.className =
      "topic-subcategory" +
      (key === currentSubCategory ? " topic-subcategory--active" : "");
    btn.textContent = sub.label;
    btn.setAttribute("data-sub", key);
    topicSubcategoryList.appendChild(btn);
  }
}

function buildPrompt(topic, answer) {
  const passage = passageInput ? passageInput.value.trim() : "";
  const passageBlock = passage ? "\n【本文】\n" + passage + "\n" : "";

  return (
    `あなたは日本語教師・添削者です。\n\n` +
    `【お題】\n` +
    topic +
    passageBlock +
    `\n【受験者の説明】\n` +
    answer +
    `\n\n` +
    `--- 要求 ---\n` +
    `・あなた自身で「良い説明」に必要な要素を 3〜4 個ほど決め、各要素ごとに点数をつけてください。\n` +
    `  例）「定義の正確さ」「例のわかりやすさ」「構成の論理性」「表現の自然さ」など。\n` +
    `・各要素について、\n` +
    `  - 何が良かったか（あれば）\n` +
    `  - 何が足りないか／誤っているか\n` +
    `  - その要素の「満点になる」書き換え例（日本語）\n` +
    `  を示してください。\n` +
    `・合計点（10点満点）も計算してください。\n` +
    `・最後に、全体としての模範解答（あなたが考えるベストな説明）を書いてください。\n` +
    `・「書き換え例」と「模範解答」の文章は、国語の文章として読みやすいように、構造的に必要な箇所（段落の切れ目や場面の切り替わりなど）だけで改行してください。\n` +
    `  文ごとに機械的に改行を入れたり、不要なスペースや改行を挿入しないでください。\n` +
    `  必要なら段落の先頭に全角スペースを 1 つ入れてもかまいません。\n\n` +
    `--- 出力形式 ---\n` +
    `以下の JSON だけを返してください。説明文やコードブロック記号は書かないでください。\n\n` +
    `{\n` +
    `  "totalScore": 0 〜 10 の整数,\n` +
    `  "totalComment": "全体講評（日本語）",\n` +
    `  "criteria": [\n` +
    `    {\n` +
    `      "name": "要素名（採点基準の要素名）",\n` +
    `      "maxScore": その要素の満点（例: 3,4 など）,\\\n` +
    `      "score": 実際に与えた点数,\n` +
    `      "reason": "その点数にした理由（日本語）",\n` +
    `      "rewriteExample": "その要素の満点になるような書き換え例（日本語）。構造的に必要な箇所だけ改行し、不要な改行やスペースは入れないこと。"\n` +
    `    }\n` +
    `  ],\n` +
    `  "modelAnswer": "全体の模範解答（日本語）"\n` +
    `}\n`
  ).trim();
}

async function callGemini(prompt, preferredModelName = PRIMARY_MODEL_NAME) {
  // 以降はフロントから自前の API 経由で Gemini を呼び出します。
  async function requestOnce(modelName) {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, modelName }),
    });

    return res;
  }

  // まずは優先モデルで試す
  let res = await requestOnce(preferredModelName);

  // レート制限などで 429 が返ってきた場合は、フォールバックモデルで一度だけリトライ
  if (res.status === 429 && preferredModelName !== FALLBACK_MODEL_NAME) {
    res = await requestOnce(FALLBACK_MODEL_NAME);
  }

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const data = await res.json();
  const text = data.text || "";

  if (!text) {
    throw new Error("Gemini からテキストが返ってきませんでした。");
  }

  return text;
}

function safeJsonParse(text) {
  try {
    // 不要なバッククォートやコードブロックをざっくり削除
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parse error", e, text);
    return null;
  }
}

function renderResult(result, rawText) {
  if (!result) {
    scoreArea.textContent = "（JSON 解析に失敗しました。生テキストを下に表示します。）";
    criteriaArea.textContent = "";
    feedbackArea.textContent = "";
    rewriteArea.textContent = "";
    modelAnswerArea.textContent = rawText;
    return;
  }

  const totalScore = result.totalScore ?? "?";
  scoreArea.textContent = `${totalScore} / 10 点`;

  // 各要素
  criteriaArea.innerHTML = "";
  rewriteArea.innerHTML = "";

  if (Array.isArray(result.criteria)) {
    for (const c of result.criteria) {
      const name = c.name ?? "要素";
      const max = c.maxScore ?? "?";
      const sc = c.score ?? "?";
      const reason = c.reason ?? "";
      const rewrite = c.rewriteExample ?? "";

      const critDiv = document.createElement("div");
      critDiv.className = "criteria-item";
      critDiv.innerHTML = `
        <div>
          <span class="criteria-item__title">${name}</span>
          <span class="criteria-item__score">${sc} / ${max} 点</span>
        </div>
        <div class="criteria-item__detail">${reason}</div>
      `;
      criteriaArea.appendChild(critDiv);

      const rewriteDiv = document.createElement("div");
      rewriteDiv.className = "criteria-item";
      rewriteDiv.innerHTML = `
        <div class="criteria-item__title">${name}</div>
        <div class="criteria-item__detail">${rewrite}</div>
      `;
      rewriteArea.appendChild(rewriteDiv);
    }
  } else {
    criteriaArea.textContent = "criteria が取得できませんでした。";
    rewriteArea.textContent = "";
  }

  feedbackArea.textContent = result.totalComment ?? "";
  modelAnswerArea.textContent = result.modelAnswer ?? "";

  // ログイン中なら結果を自動保存
  if (currentUser && db && !isLoadingFromHistory) {
    saveSession(result);
  }
}

runButton.addEventListener("click", async () => {
  const topic = topicInput.value.trim();
  const answer = answerInput.value.trim();

  if (!topic || !answer) {
    alert("お題とあなたの説明を入力してください。");
    return;
  }

  setLoading(true, "Gemini に問い合わせ中...");

  try {
    const prompt = buildPrompt(topic, answer);
    const text = await callGemini(prompt);
    const json = safeJsonParse(text);
    renderResult(json, text);
    setLoading(false, "完了しました。");

    // 一度添削した回答は編集できないようにロック
    if (answerInput) {
      answerInput.readOnly = true;
    }
  } catch (e) {
    console.error(e);
    setLoading(false, "エラーが発生しました。");
    alert("エラーが発生しました: " + e.message);
  }
});

// 入力内容に応じて「Gemini に添削してもらう」ボタンのロック状態を更新
if (topicInput) {
  topicInput.addEventListener("input", () => {
    autoResizeTextarea(topicInput);
    updateRunButtonState();
  });
}
if (answerInput) {
  answerInput.addEventListener("input", () => {
    autoResizeTextarea(answerInput);
    updateRunButtonState();
  });
}

// Firebase 認証イベントの設定
if (auth) {
  auth.onAuthStateChanged((user) => {
    currentUser = user || null;
    updateAuthUI(currentUser);
    if (currentUser) {
      loadHistory();
    } else if (historyList && historyEmpty) {
      historyList.innerHTML = "";
      historyEmpty.style.display = "block";
    }
  });

  if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch (e) {
        console.error(e);
        alert("Googleログイン中にエラーが発生しました。");
      }
    });
  }

  if (emailLoginButton) {
    emailLoginButton.addEventListener("click", async () => {
      const email = window.prompt("メールアドレスを入力してください");
      if (!email) return;
      const password = window.prompt("パスワードを入力してください（新規の場合はここで設定されます）");
      if (!password) return;
      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          // ユーザーがいなければ新規作成
          try {
            await auth.createUserWithEmailAndPassword(email, password);
          } catch (e2) {
            console.error(e2);
            alert("ユーザー作成中にエラーが発生しました。");
          }
        } else {
          console.error(e);
          alert("メールログイン中にエラーが発生しました。");
        }
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await auth.signOut();
      } catch (e) {
        console.error(e);
        alert("ログアウト中にエラーが発生しました。");
      }
    });
  }
}

// 自分でお題を作るモードに切り替え
if (manualModeButton) {
  manualModeButton.addEventListener("click", () => {
    setTopicMode("manual");

    // お題・本文は自分で作り直す前提なので初期状態（空欄）に戻す
    if (topicInput) {
      topicInput.value = "";
      autoResizeTextarea(topicInput);
    }
    if (passageInput) {
      passageInput.value = "";
      autoResizeTextarea(passageInput);
    }

    // 新しく解き直す前提で回答欄もリセット＆編集可能に戻す
    if (answerInput) {
      answerInput.readOnly = false;
      answerInput.value = "";
      autoResizeTextarea(answerInput);
    }

    updateRunButtonState();
  });
}

// メインカテゴリのクリック切り替え
if (topicMainCategoryList) {
  topicMainCategoryList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const main = target.getAttribute("data-main");
    if (!main || !TOPIC_STRUCTURE[main]) return;

    currentMainCategory = main;
    // メイン側の見た目更新
    Array.from(
      topicMainCategoryList.querySelectorAll(".topic-category")
    ).forEach((btn) => {
      btn.classList.toggle(
        "topic-category--active",
        btn.getAttribute("data-main") === currentMainCategory
      );
    });

    // サブカテゴリを更新
    renderSubcategories();
  });
}

// サブカテゴリのクリック切り替え
if (topicSubcategoryList) {
  topicSubcategoryList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const sub = target.getAttribute("data-sub");
    const main = TOPIC_STRUCTURE[currentMainCategory];
    if (!sub || !main || !main.sub[sub]) return;

    currentSubCategory = sub;

    Array.from(
      topicSubcategoryList.querySelectorAll(".topic-subcategory")
    ).forEach((btn) => {
      btn.classList.toggle(
        "topic-subcategory--active",
        btn.getAttribute("data-sub") === currentSubCategory
      );
    });
  });
}

// お題を AI にランダム生成してもらう
randomTopicButton.addEventListener("click", async () => {
  setLoading(true, "お題を生成中...");

  try {
    // メイン & サブカテゴリに応じて説明文を決める
    const main = TOPIC_STRUCTURE[currentMainCategory];
    if (!main) {
      throw new Error("ジャンルの設定に問題があります。");
    }

    const hasSub = Object.keys(main.sub).length > 0;
    const allowPassage = currentMainCategory !== "trivia"; // 雑学のときは本文を使わない
    let subLabel = "";
    let subDescription = "";

    if (hasSub) {
      const subEntry = main.sub[currentSubCategory];
      const sub =
        subEntry ?? Object.values(main.sub)[0] ?? { label: "", description: "" };
      subLabel = sub.label;
      subDescription = sub.description;
    }

    let subBlock = "";
    if (hasSub) {
      subBlock =
        "\n【観点（細かい項目）】" +
        subLabel +
        "\n【観点の説明】" +
        subDescription +
        "\n";
    }

    const prompt = `
あなたは日本語教師です。
以下の条件に合った、説明練習用のお題を 1 つだけ考えてください。

【文章のタイプ】${main.label}
【タイプの説明】${main.description}
${subBlock}

${allowPassage ? "必要であれば、短い「本文」も用意してください（特に要約や読解問題の場合など）。\n本文は国語の文章として自然な段落構成になるようにし、段落が変わるところなど構造的に必要な箇所だけで改行してください。文ごとに機械的に改行したり、不要なスペースや改行は入れないでください。必要なら段落の先頭に全角スペースを 1 つ入れてもかまいません。\n" : "今回は本文は書かず、お題の文だけを作ってください（説明の答えになる具体的な知識までは書かないようにしてください）。\n"}

--- 出力フォーマット ---
次の JSON オブジェクト 1 個だけを返してください：
{
  "topic": "お題の文（1文）",
  "passage": "お題に対応する本文。不要な場合や雑学ジャンルのときは空文字か省略にしてください。"
}

説明や前置き、コードブロック記号（バッククォート など）は書かないでください。
    `.trim();

    const text = await callGemini(prompt);
    const data = safeJsonParse(text);

    let topic = "";
    let passage = "";
    if (data && typeof data === "object") {
      topic = (data.topic || "").toString();
      passage = (data.passage || "").toString();

      // 雑学ジャンルのときは本文は使わない（答えに近づきすぎるため）
      if (!allowPassage) {
        passage = "";
      }
    } else {
      // JSON で返ってこなかった場合のフォールバック
      topic = text.replace(/\s+/g, " ").trim();
    }

    topicInput.value = topic;

    if (passageInput) {
      passageInput.value = passage;
    }
    if (passageDisplay) {
      passageDisplay.textContent = passage;
    }

    // 高さを内容に合わせて調整（本文は表示専用ブロックなので対象外）
    autoResizeTextarea(topicInput);

    // 新しいお題なので回答欄は解放して空にする
    if (answerInput) {
      answerInput.readOnly = false;
      answerInput.value = "";
      autoResizeTextarea(answerInput);
    }

    // AI でお題が決まったら AI モードに切り替え（お題・本文は編集不可）
    setTopicMode("ai");
    setLoading(false, "お題をセットしました。");
  } catch (e) {
    console.error(e);
    setLoading(false, "お題生成でエラーが発生しました。");
    alert("お題生成でエラーが発生しました: " + e.message);
  }
});

// 初期表示用にサブカテゴリを描画
renderSubcategories();
// 初期モードは自分でお題を作る
setTopicMode("manual");
// 初期のテキストエリア高さを調整
autoResizeTextarea(topicInput);
autoResizeTextarea(passageInput);
autoResizeTextarea(answerInput);

// サイドバー開閉ボタン（PC向け）
if (appRoot) {
  appRoot.classList.remove("app--sidebar-expanded");
}

if (sidebarToggleButton && appRoot) {
  sidebarToggleButton.addEventListener("click", () => {
    appRoot.classList.toggle("app--sidebar-expanded");
  });
}

// サイドバー内「新規ノートを作成」ボタン
if (newNoteButton) {
  newNoteButton.addEventListener("click", () => {
    // 入力欄を初期化して編集可能に戻す
    if (topicInput) {
      topicInput.readOnly = false;
      topicInput.value = "";
      autoResizeTextarea(topicInput);
    }
    if (passageInput) {
      passageInput.readOnly = false;
      passageInput.value = "";
      passageInput.style.display = "";
      autoResizeTextarea(passageInput);
    }
    if (passageDisplay) {
      passageDisplay.style.display = "none";
      passageDisplay.textContent = "";
    }
    if (answerInput) {
      answerInput.readOnly = false;
      answerInput.value = "";
      autoResizeTextarea(answerInput);
    }

    // 結果表示もクリア
    if (scoreArea) {
      scoreArea.textContent = "− / 10";
    }
    if (criteriaArea) {
      criteriaArea.innerHTML = "";
    }
    if (feedbackArea) {
      feedbackArea.textContent = "";
    }
    if (rewriteArea) {
      rewriteArea.innerHTML = "";
    }
    if (modelAnswerArea) {
      modelAnswerArea.textContent = "";
    }

    // ボタンを再度有効化し、モードを手動に戻す
    if (runButton) {
      runButton.disabled = false;
    }
    if (manualModeButton) {
      manualModeButton.disabled = false;
    }
    if (randomTopicButton) {
      randomTopicButton.disabled = false;
    }

    setTopicMode("manual");
    updateRunButtonState();
  });
}

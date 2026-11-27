"use strict";

(() => {
  const letters = ["A", "B", "C", "D"];
  const data = window.ITQUIZ_DATA;
  const storage = window.ITQUIZ_STORAGE;
  const get = (id) => document.getElementById(id);

  const home = get("home");
  const quiz = get("quiz");
  const result = get("result");
  const achievements = get("achievements");
  const errorBox = get("error");
  const form = get("answer-form");
  const optionsBox = get("options");
  const confirmButton = get("confirm");
  const genreSelect = get("genre-select");

  let pool = [];
  let session = null;

  function uniqueQuestions(items) {
    const seen = new Set();

    return items.filter((question) => {
      if (seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    });
  }

  function shuffled(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  function makeSessionId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2)
    );
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  function focusHeading(id) {
    get(id).focus();
  }

  function showScreen(target) {
    for (const screen of [home, quiz, result, achievements]) {
      screen.hidden = screen !== target;
    }

    window.scrollTo(0, 0);
  }

  function goHome() {
    session = null;
    clearError();
    showScreen(home);
    focusHeading("home-title");
  }

  function modeTitle() {
    if (session.mode === "challenge") {
      return "100問連続チャレンジ！！";
    }

    if (session.mode === "genre") {
      return `ジャンル別10問チャレンジ！！：${session.genre}`;
    }

    return "全ジャンル10問チャレンジ！！";
  }

  function startSession(mode, genre = "") {
    clearError();

    const candidates = mode === "genre"
      ? pool.filter((question) => question.genre === genre)
      : pool;

    const requiredCount = mode === "challenge" ? 100 : 10;

    if (candidates.length < requiredCount) {
      showError(
        `開始には、異なる問題IDの問題が${requiredCount}問必要です。` +
        `現在は${candidates.length}問です。`
      );
      return;
    }

    session = {
      id: makeSessionId(),
      mode,
      genre,
      questions: shuffled(candidates).slice(0, requiredCount),
      answers: [],
      index: 0,
      correctCount: 0,
      finished: false,
      saveResult: null
    };

    showScreen(quiz);
    renderQuestion();
  }

  function renderQuestion() {
    const question = session.questions[session.index];
    const isChallenge = session.mode === "challenge";

    get("mode-title").textContent = modeTitle();

    get("progress").textContent = isChallenge
      ? `${session.index + 1} / 100 問｜連続正解 ${session.correctCount}問`
      : `${session.index + 1} / 10 問`;

    get("prompt").textContent = question.prompt;

    optionsBox.replaceChildren();
    confirmButton.disabled = true;

    confirmButton.textContent =
      !isChallenge && session.index === session.questions.length - 1
        ? "結果を見る"
        : "次へ";

    question.options.forEach((text, index) => {
      const label = document.createElement("label");
      label.className = "option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "answer";
      radio.value = letters[index];
      radio.required = true;

      radio.addEventListener("change", () => {
        confirmButton.disabled = false;
      });

      const caption = document.createElement("span");
      caption.textContent = `${letters[index]}. ${text}`;

      label.append(radio, caption);
      optionsBox.append(label);
    });

    window.scrollTo(0, 0);
    focusHeading("progress");
  }

  function answerText(question, letter) {
    const index = letters.indexOf(letter);
    return `${letter}. ${question.options[index]}`;
  }

  function addParagraph(parent, text, className = "") {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    if (className) {
      paragraph.className = className;
    }

    parent.append(paragraph);
    return paragraph;
  }

  function makeReview(question, chosen, number) {
    const correct = chosen === question.answer;
    const article = document.createElement("article");

    // 背景色は、次のindex.html更新で適用します。
    article.className = correct
      ? "review review-correct"
      : "review review-incorrect";

    const heading = document.createElement("h3");

    heading.textContent =
      `${number}. ${correct ? "○ 正解" : "× 不正解"}\n` +
      question.prompt;

    article.append(heading);

    addParagraph(
      article,
      `自分の回答：${answerText(question, chosen)}`
    );

    addParagraph(
      article,
      `正解：${answerText(question, question.answer)}`
    );

    addParagraph(article, `解説：${question.explanation}`);

    return article;
  }

  function saveSession() {
    if (!storage) {
      return {
        ok: false,
        message:
          "保存機能が未接続のため、この回の成績は保存されていません。"
      };
    }

    try {
      return storage.recordCompletedSession(session);
    } catch (error) {
      console.warn("ITQuiz: session save failed", error);

      return {
        ok: false,
        message:
          "成績保存中にエラーが発生しました。" +
          "この回の成績は保存できていない可能性があります。"
      };
    }
  }

  function showSaveStatus(saveResult) {
    const message = get("result-message");
    message.replaceChildren();

    addParagraph(message, modeTitle());

    addParagraph(
      message,
      saveResult.ok
        ? "成績をこのブラウザーに保存しました。"
        : saveResult.message,
      saveResult.ok ? "save-success" : "save-warning"
    );
  }

  function finishTenQuestions() {
    session.finished = true;
    session.saveResult = saveSession();

    get("result-title").textContent = "10問の結果";

    get("score").textContent = session.correctCount === 10
      ? "10 / 10 PERFECT!"
      : `${session.correctCount} / 10`;

    showSaveStatus(session.saveResult);

    const reviews = get("reviews");
    reviews.replaceChildren();

    session.questions.forEach((question, index) => {
      reviews.append(
        makeReview(question, session.answers[index], index + 1)
      );
    });

    showScreen(result);
    focusHeading("result-title");
  }

  function readChallengeBest() {
    if (!storage) return null;

    try {
      if (storage.getLoadError()) return null;

      return storage.getState().challenge.bestCorrectStreak;
    } catch (error) {
      console.warn("ITQuiz: best record read failed", error);
      return null;
    }
  }

  function finishChallenge(failedQuestion = null) {
    session.finished = true;
    session.saveResult = saveSession();

    const saved = session.saveResult;
    const cleared = failedQuestion === null;

    get("result-title").textContent = cleared
      ? "100問連続チャレンジ達成"
      : "100問連続チャレンジ終了";

    get("score").textContent = cleared
      ? "🏆 100 / 100 COMPLETE!"
      : `今回の連続正解　${session.correctCount}問`;

    showSaveStatus(saved);

    const message = get("result-message");

    if (cleared) {
      addParagraph(message, "今回の連続正解　100問");
    }

    if (saved.ok) {
      addParagraph(
        message,
        `自己ベスト　${saved.state.challenge.bestCorrectStreak}問`,
        "best-record"
      );

      // 保存でき、過去最高を超えた場合だけ表示します。
      if (saved.newChallengeRecord) {
        addParagraph(message, "NEW RECORD!", "new-record");
      }
    } else {
      const previousBest = readChallengeBest();

      if (previousBest === null) {
        addParagraph(
          message,
          "自己ベスト　取得できませんでした",
          "best-record"
        );
      } else {
        addParagraph(
          message,
          `保存済みの自己ベスト　${previousBest}問`,
          "best-record"
        );
      }
    }

    const reviews = get("reviews");
    reviews.replaceChildren();

    // 不正解時は、その問題だけを表示します。
    // 回答数は結果画面に表示しません。
    if (failedQuestion) {
      const chosen = session.answers[session.answers.length - 1];

      reviews.append(
        makeReview(failedQuestion, chosen, session.index + 1)
      );
    }

    showScreen(result);
    focusHeading("result-title");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!session || session.finished || quiz.hidden) return;

    const selected = form.querySelector(
      'input[name="answer"]:checked'
    );

    if (!selected) return;

    confirmButton.disabled = true;

    const question = session.questions[session.index];
    const correct = selected.value === question.answer;

    session.answers.push(selected.value);

    if (correct) {
      session.correctCount++;
    }

    if (session.mode === "challenge" && !correct) {
      finishChallenge(question);
      return;
    }

    session.index++;

    if (session.index === session.questions.length) {
      if (session.mode === "challenge") {
        finishChallenge();
      } else {
        finishTenQuestions();
      }

      return;
    }

    // 10問モードでは、回答中に正誤を表示しません。
    renderQuestion();
  });

  get("start-random").addEventListener("click", () => {
    startSession("random");
  });

  get("start-genre").addEventListener("click", () => {
    startSession("genre", genreSelect.value);
  });

  get("start-challenge").addEventListener("click", () => {
    startSession("challenge");
  });

  get("open-achievements").addEventListener("click", () => {
    clearError();
    showScreen(achievements);
    focusHeading("achievements-title");
  });

  get("quit").addEventListener("click", () => {
    if (
      window.confirm(
        "この回をやめてホームへ戻りますか？" +
        "途中の回答は保存されません。"
      )
    ) {
      goHome();
    }
  });

  document.querySelectorAll("[data-home]").forEach((button) => {
    button.addEventListener("click", goHome);
  });

  if (
    !data ||
    data.schemaVersion !== 1 ||
    !Array.isArray(data.questions)
  ) {
    for (const id of [
      "start-random",
      "start-genre",
      "start-challenge"
    ]) {
      get(id).disabled = true;
    }

    showError(
      "問題データを読み込めませんでした。" +
      "questions.jsが保存されているか確認してください。"
    );

    return;
  }

  pool = uniqueQuestions(data.questions);

  const genres = [
    ...new Set(pool.map((question) => question.genre))
  ].sort((a, b) => a.localeCompare(b, "ja"));

  genreSelect.replaceChildren();

  for (const genre of genres) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreSelect.append(option);
  }

  function updateGenreButton() {
    const count = pool.filter(
      (question) => question.genre === genreSelect.value
    ).length;

    get("start-genre").disabled = count < 10;

    get("genre-note").textContent = count >= 10
      ? `${count}問から、問題IDの重複なしで10問出題します。`
      : `このジャンルは${count}問です。開始には10問必要です。`;
  }

  genreSelect.addEventListener("change", updateGenreButton);
  updateGenreButton();

  get("start-random").disabled = pool.length < 10;
  get("start-challenge").disabled = pool.length < 100;

  get("data-summary").textContent =
    `ダミーデータ：${pool.length}問・${genres.length}ジャンル`;

  get("challenge-note").textContent = pool.length >= 100
    ? "100問を問題IDの重複なしで出題。不正解でその回は終了します。"
    : `現在${pool.length}問です。開始には100問必要です。`;

  if (storage && storage.getLoadError()) {
    showError(storage.getLoadError());
  }
})();

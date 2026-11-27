"use strict";

(() => {
  const get = (id) => document.getElementById(id);
  const panel = get("achievements");
  const openButton = get("open-achievements");
  const home = get("home");
  const storage = window.ITQUIZ_STORAGE;

  if (!panel || !openButton || !home) return;

  const levels = [
    { name: "ブロンズ", symbol: "🥉" },
    { name: "シルバー", symbol: "🥈" },
    { name: "ゴールド", symbol: "🥇" },
    { name: "プラチナ", symbol: "💎" }
  ];

  const style = document.createElement("style");
  style.textContent = `
    .study-banner {
      margin: 16px 0;
      padding: 18px;
      border: 2px solid #a9c6b7;
      border-radius: 12px;
      background: #edf8f0;
    }
    .study-banner-title {
      margin: 0 0 12px;
      color: #184c33;
      font-size: clamp(1.15rem, 5vw, 1.4rem);
      font-weight: bold;
    }
    .study-day-count {
      font-size: 1.35em;
    }
    .study-status {
      display: inline-block;
      margin: 0;
      padding: 5px 12px;
      border: 1px solid #9b6816;
      border-radius: 8px;
      background: #fff5df;
      color: #70470b;
      font-weight: bold;
    }
    .study-status.done {
      border-color: #42815c;
      background: #dcefe1;
      color: #193d28;
    }
    .study-banner .note {
      margin: 10px 0 0;
    }
    .achievement-block {
      margin: 22px 0;
      padding: 16px;
      border: 2px solid #c5d1da;
      border-radius: 12px;
      background: #fff;
    }
    .achievement-block h3 {
      margin: 0 0 12px;
    }
    .achievement-badges {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin: 16px 0;
    }
    .achievement-badge {
      padding: 12px;
      border: 1px solid #c5cdd3;
      border-radius: 10px;
      background: #f0f3f5;
      color: #4c5965;
    }
    .achievement-badge.earned {
      border: 2px solid #42815c;
      background: #edf8f0;
      color: #193d28;
    }
    .achievement-badge.platinum.earned {
      border-color: #6669ab;
      background: #f0efff;
      color: #35335f;
    }
    .achievement-badge strong,
    .achievement-badge span {
      display: block;
    }
    .achievement-badge span {
      margin-top: 5px;
      font-size: 0.85rem;
    }
    .achievement-progress {
      width: 100%;
      height: 18px;
      accent-color: #185c45;
    }
    .achievement-summary {
      padding: 12px;
      border-radius: 8px;
      background: #edf2f8;
      font-weight: bold;
    }
  `;
  document.head.append(style);

  function add(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    if (text !== null) element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  }

  function localDateKey() {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  // 現地日付の文字列を、比較用の日番号に変換します。
  // 日付間の計算では、夏時間による時間差の影響を避けます。
  function dayNumber(key) {
    if (
      typeof key !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(key)
    ) {
      return null;
    }

    const [year, month, day] = key.split("-").map(Number);
    const time = Date.UTC(year, month - 1, day);

    if (new Date(time).toISOString().slice(0, 10) !== key) {
      return null;
    }

    return Math.floor(time / 86400000);
  }

  function studySummary(dates) {
    const today = dayNumber(localDateKey());
    const days = [...new Set(
      dates.map(dayNumber).filter(
        (day) => day !== null && day <= today
      )
    )].sort((a, b) => a - b);

    let best = 0;
    let run = 0;
    let previous = null;

    for (const day of days) {
      run = previous !== null && day === previous + 1
        ? run + 1
        : 1;

      best = Math.max(best, run);
      previous = day;
    }

    const daySet = new Set(days);
    let cursor = daySet.has(today) ? today : today - 1;
    let current = 0;

    while (daySet.has(cursor)) {
      current++;
      cursor--;
    }

    return {
      current,
      best,
      total: days.length,
      studiedToday: daySet.has(today)
    };
  }

  function readState() {
    if (!storage) {
      throw new Error("成績の保存機能を読み込めませんでした。");
    }

    const error = storage.getLoadError();
    if (error) throw new Error(error);

    return storage.getState();
  }

  function renderHomeStudy() {
    const box = get("home-study");
    if (!box) return;

    box.replaceChildren();

    try {
      const study = studySummary(readState().studyDates);

      const title = add(
        box,
        "p",
        null,
        "study-banner-title"
      );

      title.append(document.createTextNode("現在 "));
      add(title, "strong", `${study.current}日`, "study-day-count");
      title.append(document.createTextNode(" 連続学習中"));

      add(
        box,
        "p",
        study.studiedToday
          ? "本日：学習済み ✓"
          : "本日：未実施",
        study.studiedToday
          ? "study-status done"
          : "study-status"
      );

      add(
        box,
        "p",
        study.studiedToday
          ? "今日の学習日は記録済みです。同じ日は1日分として数えます。"
          : "今日はまだ学習日の条件を満たしていません。",
        "note"
      );

      add(
        box,
        "p",
        "10問モードを完了、または100問連続チャレンジで" +
        "10問以上に回答すると、本日の学習済みになります。",
        "note"
      );

      if (!study.studiedToday && study.current > 0) {
        add(
          box,
          "p",
          "表示日数は昨日までの記録です。今日も学習すると継続できます。",
          "note"
        );
      }
    } catch (error) {
      add(
        box,
        "p",
        "連続学習・本日の状態を取得できませんでした。",
        "study-banner-title"
      );
      add(box, "p", error.message, "note");
    }
  }

  function badgeBlock({
    title, summary, thresholds, current, best, condition
  }) {
    const block = add(
      panel, "section", null, "achievement-block"
    );

    add(block, "h3", title);
    add(block, "p", summary, "achievement-summary");

    const badges = add(
      block, "div", null, "achievement-badges"
    );

    levels.forEach((level, index) => {
      const earned = best >= thresholds[index];

      const badge = add(
        badges,
        "div",
        null,
        "achievement-badge" +
        (earned ? " earned" : "") +
        (index === 3 ? " platinum" : "")
      );

      add(badge, "strong", `${level.symbol} ${level.name}`);
      add(badge, "span", earned ? "取得済み" : "未取得");
      add(badge, "span", condition(thresholds[index]));
    });

    const nextIndex = thresholds.findIndex(
      (threshold) => best < threshold
    );

    if (nextIndex === -1) {
      add(block, "p", "💎 プラチナまで取得済みです。");
      return block;
    }

    const target = thresholds[nextIndex];
    const value = Math.min(current, target);

    add(
      block,
      "p",
      `次は${levels[nextIndex].name}：` +
      `${value} / ${target}（${condition(target)}）`
    );

    const progress = add(
      block, "progress", null, "achievement-progress"
    );

    progress.max = target;
    progress.value = value;
    progress.setAttribute(
      "aria-label",
      `${title}、次のバッジまで${value} / ${target}`
    );

    return block;
  }

  function addBackButton() {
    const button = add(panel, "button", "ホームへ戻る");
    button.type = "button";

    button.addEventListener("click", () => {
      panel.hidden = true;
      home.hidden = false;
      renderHomeStudy();
      window.scrollTo(0, 0);
      get("home-title").focus();
    });
  }

  function renderAchievements() {
    panel.replaceChildren();

    const heading = add(panel, "h2", "実績確認");
    heading.id = "achievements-title";
    heading.tabIndex = -1;

    let state;

    try {
      state = readState();
    } catch (error) {
      add(panel, "p", error.message, "save-warning");
      addBackButton();
      heading.focus();
      return;
    }

    const study = studySummary(state.studyDates);

    add(
      panel,
      "p",
      "この端末・このブラウザーに保存したダミー版の成績です。",
      "note"
    );

    badgeBlock({
      title: "全ジャンル10問チャレンジ！！",
      summary:
        `現在 ${state.random.currentPerfectStreak}回連続満点 ／ ` +
        `自己ベスト ${state.random.bestPerfectStreak}回 ／ ` +
        `完了 ${state.random.completedCount}回`,
      thresholds: [2, 4, 7, 10],
      current: state.random.currentPerfectStreak,
      best: state.random.bestPerfectStreak,
      condition: (value) => `${value}回連続満点`
    });

    badgeBlock({
      title: "100問連続チャレンジ！！",
      summary:
        `自己ベスト ${state.challenge.bestCorrectStreak}問連続正解 ／ ` +
        `100問クリア ${state.challenge.clearCount}回`,
      thresholds: [10, 25, 50, 100],
      current: state.challenge.bestCorrectStreak,
      best: state.challenge.bestCorrectStreak,
      condition: (value) => `1回の挑戦で${value}問連続正解`
    });

    badgeBlock({
      title: "連続学習",
      summary:
        `現在 ${study.current}日 ／ 最長 ${study.best}日 ／ ` +
        `累計学習日 ${study.total}日`,
      thresholds: [3, 7, 30, 100],
      current: study.current,
      best: study.best,
      condition: (value) => `${value}日連続で学習`
    });

    add(
      panel,
      "p",
      study.studiedToday
        ? "本日：学習済み ✓"
        : "本日：未実施",
      study.studiedToday
        ? "study-status done"
        : "study-status"
    );

    add(
      panel,
      "p",
      "学習日は、10問モードの完了、または100問連続チャレンジで" +
      "10問以上に回答した日です。同じ日は1日分として数えます。" +
      "今日が未実施でも、昨日まで続いていれば連続記録は継続中と表示します。",
      "note"
    );

    const genres = new Set([
      ...(window.ITQUIZ_DATA?.questions || []).map(
        (question) => question.genre
      ),
      ...Object.keys(state.genres)
    ]);

    add(panel, "h3", "ジャンル別の実績");

    for (const genre of [...genres].sort(
      (a, b) => a.localeCompare(b, "ja")
    )) {
      const record = Object.hasOwn(state.genres, genre)
        ? state.genres[genre]
        : {
            currentPerfectStreak: 0,
            bestPerfectStreak: 0,
            completedCount: 0,
            answeredCount: 0,
            correctCount: 0
          };

      const block = badgeBlock({
        title: genre,
        summary:
          `現在 ${record.currentPerfectStreak}回連続満点 ／ ` +
          `自己ベスト ${record.bestPerfectStreak}回 ／ ` +
          `ジャンル別10問完了 ${record.completedCount}回`,
        thresholds: [2, 4, 7, 10],
        current: record.currentPerfectStreak,
        best: record.bestPerfectStreak,
        condition: (value) => `このジャンルで${value}回連続満点`
      });

      const rate = record.answeredCount > 0
        ? `${(
            record.correctCount / record.answeredCount * 100
          ).toFixed(1)}%`
        : "—";

      add(
        block,
        "p",
        `正解率 ${rate} ／ 回答数 ${record.answeredCount}問 ／ ` +
        `正解数 ${record.correctCount}問`
      );
    }

    add(
      panel,
      "p",
      "ジャンル別正解率は、保存された完了回の回答を" +
      "全モード分まとめたものです。途中でやめた回は含みません。" +
      "ジャンル別の連続満点バッジは、そのジャンルの10問モードで判定します。",
      "note"
    );

    addBackButton();
    heading.focus();
  }

  openButton.textContent = "実績を確認する";
  openButton.addEventListener("click", renderAchievements);

  // 結果画面からホームへ戻ったときに、保存後の状態を再表示します。
  const observer = new MutationObserver(() => {
    if (!home.hidden) renderHomeStudy();
  });

  observer.observe(home, {
    attributes: true,
    attributeFilter: ["hidden"]
  });

  // 別タブでの成績変更も反映します。
  // 保存処理が保持する状態との不一致を避けるため、再読み込みを案内します。
  window.addEventListener("storage", (event) => {
    if (
      event.key !== null &&
      event.key !== "itquiz.practice.progress.v1"
    ) {
      return;
    }

    const errorBox = get("error");

    if (errorBox) {
      errorBox.textContent =
        "別のタブで成績が変更されました。" +
        "このタブでは続けて回答せず、ページを再読み込みしてください。";
      errorBox.hidden = false;
    }

    for (const id of [
      "start-random", "start-genre", "start-challenge", "confirm"
    ]) {
      const button = get(id);
      if (button) button.disabled = true;
    }
  });

  // 日付をまたいだ場合や、スマホで画面に戻った場合も更新します。
  let displayedDate = localDateKey();

  window.setInterval(() => {
    const today = localDateKey();

    if (today !== displayedDate) {
      displayedDate = today;
      if (!home.hidden) renderHomeStudy();
    }
  }, 30000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !home.hidden) {
      displayedDate = localDateKey();
      renderHomeStudy();
    }
  });

  renderHomeStudy();
})();

"use strict";

/*
 * IT基礎クイズ：成績保存
 *
 * このファイル単体では保存処理を実行しません。
 * アプリ側からrecordCompletedSessionを呼び出したときに保存します。
 *
 * ダミー版専用の保存キーです。
 * 本番版に切り替える際、テスト成績を引き継がないようにします。
 */

(() => {
  const STORAGE_KEY = "itquiz.practice.progress.v1";

  function freshState() {
    return {
      schemaVersion: 1,
      updatedAt: null,

      random: {
        currentPerfectStreak: 0,
        bestPerfectStreak: 0,
        completedCount: 0
      },

      genres: {},

      challenge: {
        bestCorrectStreak: 0,
        completedCount: 0,
        clearCount: 0
      },

      studyDates: [],

      // 完了処理の二重実行を防ぐため、直近の識別子を保持します。
      recentSessionIds: []
    };
  }

  function freshGenre() {
    return {
      currentPerfectStreak: 0,
      bestPerfectStreak: 0,
      completedCount: 0,
      answeredCount: 0,
      correctCount: 0,
      seenPointsInStreak: [],
      recentTenQuestionResults: []
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function isObject(value) {
    return value !== null &&
      typeof value === "object" &&
      !Array.isArray(value);
  }

  function validateState(value) {
    if (
      !isObject(value) ||
      value.schemaVersion !== 1 ||
      !isObject(value.random) ||
      !isObject(value.genres) ||
      !isObject(value.challenge) ||
      !Array.isArray(value.studyDates) ||
      !Array.isArray(value.recentSessionIds)
    ) {
      throw new Error("保存されている成績データの形式を確認できません。");
    }
  }

  let state;
  let loadError = "";

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      state = freshState();
    } else {
      const parsed = JSON.parse(raw);
      validateState(parsed);
      state = parsed;
    }
  } catch (error) {
    state = freshState();
    loadError =
      "保存済みの成績を読み込めませんでした。" +
      "既存データの上書きを防ぐため、このページでは保存を停止しています。";
    console.warn("ITQuiz: progress load failed", error);
  }

  function getState() {
    // 呼び出し元の変更で、保存前の状態が書き換わらないようにします。
    return clone(state);
  }

  function ensureGenre(target, genre) {
    if (!Object.hasOwn(target.genres, genre)) {
      Object.defineProperty(target.genres, genre, {
        value: freshGenre(),
        enumerable: true,
        configurable: true,
        writable: true
      });
    }

    return target.genres[genre];
  }

  function updatePerfectStreak(record, perfect) {
    record.completedCount++;

    record.currentPerfectStreak = perfect
      ? record.currentPerfectStreak + 1
      : 0;

    record.bestPerfectStreak = Math.max(
      record.bestPerfectStreak,
      record.currentPerfectStreak
    );
  }

  function validateSession(session) {
    if (
      !isObject(session) ||
      typeof session.id !== "string" ||
      session.id.length === 0 ||
      !["random", "genre", "challenge"].includes(session.mode) ||
      !Array.isArray(session.questions) ||
      !Array.isArray(session.answers)
    ) {
      throw new Error("成績保存に必要な情報が不足しています。");
    }

    const answeredCount = session.answers.length;

    if (
      answeredCount === 0 ||
      answeredCount > session.questions.length ||
      session.answers.some(
        (answer) => !["A", "B", "C", "D"].includes(answer)
      )
    ) {
      throw new Error("回答データが正しくありません。");
    }

    const ids = new Set();

    for (const question of session.questions) {
      if (
        !isObject(question) ||
        typeof question.id !== "string" ||
        typeof question.genre !== "string" ||
        !["A", "B", "C", "D"].includes(question.answer) ||
        ids.has(question.id)
      ) {
        throw new Error("出題データに形式の誤りやIDの重複があります。");
      }

      ids.add(question.id);
    }

    if (session.mode !== "challenge") {
      if (
        session.questions.length !== 10 ||
        answeredCount !== 10
      ) {
        throw new Error("10問モードは、全10問を完了した場合だけ保存できます。");
      }

      if (
        session.mode === "genre" &&
        (
          typeof session.genre !== "string" ||
          session.questions.some(
            (question) => question.genre !== session.genre
          )
        )
      ) {
        throw new Error("選択ジャンルと出題内容が一致していません。");
      }

      return;
    }

    if (session.questions.length !== 100) {
      throw new Error("100問チャレンジの出題数が正しくありません。");
    }

    const correctFlags = session.answers.map(
      (answer, index) => answer === session.questions[index].answer
    );

    const firstWrongIndex = correctFlags.indexOf(false);

    // 不正解で終了した場合、その後の回答があってはいけません。
    if (
      firstWrongIndex !== -1 &&
      firstWrongIndex !== answeredCount - 1
    ) {
      throw new Error("不正解になった後の回答が含まれています。");
    }

    // 途中でやめた回は、今回の段階では完了成績として保存しません。
    if (firstWrongIndex === -1 && answeredCount !== 100) {
      throw new Error("この100問チャレンジはまだ終了していません。");
    }
  }

  function recordCompletedSession(session) {
    try {
      validateSession(session);
    } catch (error) {
      return {
        ok: false,
        message: error.message
      };
    }

    if (loadError) {
      return {
        ok: false,
        message: loadError
      };
    }

    if (state.recentSessionIds.includes(session.id)) {
      return {
        ok: true,
        duplicate: true,
        newChallengeRecord: false,
        state: getState()
      };
    }

    const next = clone(state);
    const answeredCount = session.answers.length;

    const correctCount = session.answers.filter(
      (answer, index) => answer === session.questions[index].answer
    ).length;

    const previousChallengeBest = next.challenge.bestCorrectStreak;

    // ジャンル別の正解率には、すべてのモードの確定回答を含めます。
    for (let index = 0; index < answeredCount; index++) {
      const question = session.questions[index];
      const genreRecord = ensureGenre(next, question.genre);

      genreRecord.answeredCount++;

      if (session.answers[index] === question.answer) {
        genreRecord.correctCount++;
      }
    }

    if (session.mode === "random") {
      updatePerfectStreak(next.random, correctCount === 10);
    }

    if (session.mode === "genre") {
      const genreRecord = ensureGenre(next, session.genre);
      const perfect = correctCount === 10;

      updatePerfectStreak(genreRecord, perfect);

      // 更新前の保存データには、この項目がないため補います。
      if (!Array.isArray(genreRecord.recentTenQuestionResults)) {
        genreRecord.recentTenQuestionResults = [];
      }

      // 古い順に保存し、直近10回だけを保持します。
      genreRecord.recentTenQuestionResults.push({
        completedAt: new Date().toISOString(),
        correctCount,
        answeredCount: 10
      });

      genreRecord.recentTenQuestionResults =
        genreRecord.recentTenQuestionResults.slice(-10);

      if (perfect) {
        const points = new Set(genreRecord.seenPointsInStreak);

        for (const question of session.questions) {
          if (
            typeof question.point === "string" &&
            question.point.length > 0
          ) {
            points.add(question.point);
          }
        }

        genreRecord.seenPointsInStreak = [...points];
      } else {
        genreRecord.seenPointsInStreak = [];
      }
    }

    if (session.mode === "challenge") {
      next.challenge.completedCount++;

      next.challenge.bestCorrectStreak = Math.max(
        previousChallengeBest,
        correctCount
      );

      if (correctCount === 100) {
        next.challenge.clearCount++;
      }
    }

    /*
     * 学習日の条件：
     * ・10問モードを完了
     * ・100問チャレンジで10問以上に回答
     *
     * 10問目が不正解でも、回答数が10問なら対象です。
     */
    const qualifiesAsStudyDay =
      session.mode !== "challenge" || answeredCount >= 10;

    if (qualifiesAsStudyDay) {
      const today = localDateKey();

      if (!next.studyDates.includes(today)) {
        next.studyDates.push(today);
        next.studyDates.sort();
      }
    }

    next.recentSessionIds.push(session.id);
    next.recentSessionIds = next.recentSessionIds.slice(-100);
    next.updatedAt = new Date().toISOString();

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch (error) {
      console.warn("ITQuiz: progress save failed", error);

      return {
        ok: false,
        message:
          "成績を端末内に保存できませんでした。" +
          "ブラウザーの保存設定や空き容量を確認してください。"
      };
    }

    // 保存に成功した場合だけ、メモリー上の成績も更新します。
    state = next;

    return {
      ok: true,
      duplicate: false,
      correctCount,
      answeredCount,
      previousChallengeBest,
      newChallengeRecord:
        session.mode === "challenge" &&
        correctCount > previousChallengeBest,
      state: getState()
    };
  }

  window.ITQUIZ_STORAGE = Object.freeze({
    getState,
    recordCompletedSession,
    getLoadError: () => loadError
  });
})();

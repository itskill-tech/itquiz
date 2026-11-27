"use strict";

/*
 * IT基礎クイズ：機能確認用ダミーデータ
 *
 * 本番の問題データではありません。
 * 3ジャンル × 40問 = 120問を生成します。
 *
 * 同じ内容の繰り返しを含みますが、IDはすべて異なります。
 * 問題IDの重複防止、ジャンル選択、100問チャレンジ、
 * 学習ポイントの出題優先などを確認するためのデータです。
 *
 * 本番データへの切り替え時、この生成処理は使用しません。
 */

(() => {
  const letters = ["A", "B", "C", "D"];

  const groups = [
    {
      code: "computer",
      genre: "コンピューター基礎",
      templates: [
        {
          point: "dummy-cpu",
          prompt: "CPUの主な役割はどれですか？",
          options: [
            "演算や制御を行う",
            "用紙に印刷する",
            "音を出す",
            "画面を照らす"
          ],
          answer: "A",
          explanation:
            "CPUは、プログラムの命令に従って演算や制御を行います。"
        },
        {
          point: "dummy-memory",
          prompt: "RAMの説明として適切なのはどれですか？",
          options: [
            "用紙を保管する装置",
            "処理中のデータなどを一時的に保持するメモリー",
            "通信ケーブルの種類",
            "印刷の色を表す仕組み"
          ],
          answer: "B",
          explanation:
            "RAMは、実行中のプログラムや処理中のデータなどを一時的に保持します。"
        },
        {
          point: "dummy-os",
          prompt: "OSの役割として適切なのはどれですか？",
          options: [
            "机の高さを調整する",
            "用紙を裁断する",
            "機器の資源を管理し、アプリの動作を支える",
            "回線契約を販売する"
          ],
          answer: "C",
          explanation:
            "OSは、メモリーや周辺機器などを管理し、アプリが動くための基本機能を提供します。"
        },
        {
          point: "dummy-backup",
          prompt: "バックアップを作成する主な目的はどれですか？",
          options: [
            "画面を明るくする",
            "文字を大きくする",
            "通信を必ず高速化する",
            "データの消失や故障に備える"
          ],
          answer: "D",
          explanation:
            "データが失われても復元できるよう、別の場所などにコピーを保管します。"
        }
      ]
    },
    {
      code: "web",
      genre: "Web・ネットワーク",
      templates: [
        {
          point: "dummy-browser",
          prompt: "Webページの閲覧に使うソフトウェアはどれですか？",
          options: [
            "ブラウザー",
            "電卓",
            "圧縮ソフト",
            "音量調整ツール"
          ],
          answer: "A",
          explanation:
            "Chromeなどのブラウザーを使ってWebページを閲覧します。"
        },
        {
          point: "dummy-url",
          prompt: "URLの説明として適切なのはどれですか？",
          options: [
            "画面の明るさを表す数値",
            "Webページなどの資源の場所やアクセス方法を表すもの",
            "電池の残量を表す単位",
            "キーボードの重さを表す単位"
          ],
          answer: "B",
          explanation:
            "URLは、Webページなどの資源の場所やアクセス方法を表します。"
        },
        {
          point: "dummy-https",
          prompt: "HTTPSの説明として適切なのはどれですか？",
          options: [
            "画面を必ず高速表示する仕組み",
            "掲載情報の正しさをすべて保証する仕組み",
            "通信を暗号化してHTTPのやり取りを行う仕組み",
            "端末内の全ファイルを公開する仕組み"
          ],
          answer: "C",
          explanation:
            "HTTPSは通信を暗号化します。ただし、サイトの内容が正しいことまで保証するものではありません。"
        },
        {
          point: "dummy-offline",
          prompt: "Webアプリのオフライン利用について適切なのはどれですか？",
          options: [
            "すべてのWebサイトが必ず使える",
            "インターネット接続がないと電卓も動かない",
            "初めて開くサイトも必ず利用できる",
            "事前保存などに対応したアプリでは利用できる場合がある"
          ],
          answer: "D",
          explanation:
            "必要なファイルやデータを事前保存する仕組みがあれば、オフラインでも利用できる場合があります。"
        }
      ]
    },
    {
      code: "security",
      genre: "セキュリティ基礎",
      templates: [
        {
          point: "dummy-password",
          prompt: "パスワードの管理として適切なのはどれですか？",
          options: [
            "サービスごとに異なるものを使う",
            "すべてのサービスで同じものを使う",
            "公開プロフィールに記載する",
            "関係のない人へ配布する"
          ],
          answer: "A",
          explanation:
            "使い回しを避けることで、あるサービスからの漏えいが他へ波及するリスクを下げられます。"
        },
        {
          point: "dummy-phishing",
          prompt: "不審なメールを受け取ったときの対応として適切なのはどれですか？",
          options: [
            "添付ファイルをすぐ開く",
            "リンクを開かず、社内ルールに従って報告・相談する",
            "パスワードを返信する",
            "内容を確認せず全員へ転送する"
          ],
          answer: "B",
          explanation:
            "不審なリンクや添付ファイルは開かず、社内のルールに従って報告・相談します。"
        },
        {
          point: "dummy-update",
          prompt: "ソフトウェアを更新する理由として適切なのはどれですか？",
          options: [
            "パスワードを公開するため",
            "必ず保存容量をゼロにするため",
            "不具合や脆弱性の修正などを行うため",
            "画面を物理的に大きくするため"
          ],
          answer: "C",
          explanation:
            "更新には、不具合や脆弱性の修正、機能の改善などが含まれます。"
        },
        {
          point: "dummy-string",
          prompt:
            "【文字列の表示確認】先頭が「=」の選択肢はどれですか？",
          options: [
            "2026/01/02",
            "#N/A",
            "00123",
            "=SUM(A1:A3)"
          ],
          answer: "D",
          explanation:
            "数式・日付・エラー値・数値に見える内容も、このアプリでは文字列のまま表示します。"
        }
      ]
    }
  ];

  const questions = [];

  for (const group of groups) {
    for (let index = 0; index < 40; index++) {
      const template = group.templates[index % group.templates.length];

      /*
       * 繰り返しごとに選択肢の並びを回転させます。
       * 正解の文字も、移動先に合わせて変更します。
       * 元の選択肢の文字列は変換しません。
       */
      const shift = Math.floor(index / group.templates.length) % 4;
      const correctIndex = letters.indexOf(template.answer);

      const options = template.options.map(
        (_, optionIndex) => template.options[(optionIndex + shift) % 4]
      );

      const rotatedCorrectIndex = (correctIndex - shift + 4) % 4;
      const number = String(index + 1).padStart(3, "0");

      questions.push({
        id: `dummy-${group.code}-${number}`,
        genre: group.genre,
        point: template.point,
        prompt: `【ダミー ${number}】${template.prompt}`,
        options,
        answer: letters[rotatedCorrectIndex],
        explanation: template.explanation
      });
    }
  }

  // 機能テスト用データの最低限の整合性チェックです。
  const ids = new Set();

  if (questions.length !== 120) {
    throw new Error("ダミー問題の件数が120問ではありません。");
  }

  for (const question of questions) {
    if (ids.has(question.id)) {
      throw new Error(`問題IDが重複しています：${question.id}`);
    }
    ids.add(question.id);

    if (
      question.options.length !== 4 ||
      !question.options.every((option) => typeof option === "string") ||
      !letters.includes(question.answer)
    ) {
      throw new Error(`問題の形式に誤りがあります：${question.id}`);
    }
  }

  // 次の手順で追加するアプリ処理から参照します。
  window.ITQUIZ_DATA = {
    schemaVersion: 1,
    questions
  };
})();

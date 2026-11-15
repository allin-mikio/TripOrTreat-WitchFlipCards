(function () {
  "use strict";

  var CSV_URL = "cards.csv";
  var AUTO_BACK_MS = 10000;

  var grid = document.getElementById("card-grid");
  var statusEl = document.getElementById("status");

  function setStatus(message, isError) {
    if (!statusEl) return;
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#ff8a80" : "";
  }

  function parseCsv(text) {
    var lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
    var cards = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      var cols = line.split(",");
      // データ行: 白漢字,白読み,白英語,黒漢字,黒読み,黒英語
      if (cols.length < 6) continue;
      if (cols[0] === "白面" || cols[0] === "漢字") continue;

      var whiteKanji = (cols[0] || "").trim();
      var whiteYomi = (cols[1] || "").trim();
      var whiteEn = (cols[2] || "").trim();
      var blackKanji = (cols[3] || "").trim();
      var blackYomi = (cols[4] || "").trim();
      var blackEn = (cols[5] || "").trim();

      if (!whiteKanji && !blackKanji) continue;

      cards.push({
        white: { kanji: whiteKanji, yomi: whiteYomi, en: whiteEn },
        black: { kanji: blackKanji, yomi: blackYomi, en: blackEn },
      });
    }

    return cards;
  }

  function createFace(side, data) {
    var face = document.createElement("div");
    face.className = "face face-" + side;
    face.setAttribute("aria-hidden", side === "back" ? "true" : "false");

    var body = document.createElement("div");
    body.className = "face-body";

    var yomi = document.createElement("div");
    yomi.className = "yomi";
    yomi.textContent = data.yomi;

    var kanji = document.createElement("div");
    kanji.className = "kanji";
    kanji.textContent = data.kanji;

    body.appendChild(yomi);
    body.appendChild(kanji);

    var footer = document.createElement("div");
    footer.className = "face-footer";

    var mark = document.createElement("span");
    mark.className = "footer-mark";
    mark.setAttribute("aria-hidden", "true");
    // Wingdings "F" (右指差し) のアウトラインを SVG 化。スマホに Wingdings が無いため埋め込み。
    mark.innerHTML =
      '<svg class="footer-mark-svg" viewBox="0 0 108 57.21" focusable="false" aria-hidden="true">' +
      '<path fill="currentColor" fill-rule="evenodd" d="' +
      "M7.03 41.84H16.07Q23.33 49.74 30.22 52.89Q32.81 53.21 34.01 53.21Q37.48 53.21 41.46 51.95L43.8 52.96L46.01 53.08Q55.48 53.08 55.48 46.26Q55.48 45.95 55.36 45.25Q58.9 44.75 60.66 43.01Q62.43 41.27 62.43 38.24Q62.43 36.91 61.74 35.14Q64.58 34.39 66 32.74Q67.42 31.1 67.42 28.64Q67.42 26.8 66.63 25.45Q65.84 24.09 64.27 23.14L66.54 22.64L89.28 22.38Q96.61 22.38 100.3 20.68Q104 18.97 104 15.62Q104 11.71 100.46 10.13Q96.92 8.55 88.02 8.55L62.18 7.98L59.59 5.58L42.22 4Q30.22 7.47 20.87 12.15H7.35Q4 19.29 4 27.44Q4 34.64 7.03 41.84ZM65.47 11.08 88.59 11.64Q100.9 11.64 100.9 15.69Q100.9 17.46 97.08 18.37Q93.26 19.29 85.62 19.29L71.28 19.35Q71.91 18.78 72.79 17.77ZM9.18 38.55Q7.22 32.68 7.22 27.06Q7.22 21.12 9.43 15.24H20.93Q36.98 8.8 42.41 7.22L58.39 8.61L68.31 17.71Q65.53 20.17 61.99 20.17Q56.56 20.17 51.19 14.55Q45.44 17.83 39.25 17.83L38.18 17.77L38.3 20.93L39.75 20.99Q45.44 20.99 50.56 18.28Q54.28 21.18 57.44 22.38L51.76 22.45Q50.05 21.5 48.41 21.06Q46.77 20.61 45.19 20.61Q37.92 20.61 33.63 29.02L38.05 30.91Q33.88 32.24 30.41 38.18L34.32 39.94Q30.78 42.85 29.21 46.58L37.1 49.93Q33.88 50.37 32.93 50.37Q32.3 50.37 30.72 50.11Q23.39 45.82 17.71 38.55ZM37.99 27.75Q40.39 23.65 45.19 23.65Q46.58 23.65 48 24.15Q49.42 24.66 50.87 25.67H59.02Q61.61 25.67 62.91 26.39Q64.2 27.12 64.2 28.57Q64.2 30.6 62.31 31.64Q60.41 32.68 56.68 32.68L49.99 32.62ZM35.02 36.85Q37.23 33.5 42.41 32.81L48.98 35.71L58.2 35.65Q59.15 37.16 59.15 38.3Q59.15 40.26 57.6 41.27Q56.05 42.28 52.96 42.28L47.27 42.16ZM33.63 45.06Q35.02 43.23 37.73 41.52L46.2 45.25H52.33Q52.33 49.99 46.45 49.99L43.99 49.93Z" +
      '"/></svg>';

    var en = document.createElement("span");
    en.className = "en";
    en.textContent = data.en;

    footer.appendChild(mark);
    footer.appendChild(en);

    face.appendChild(body);
    face.appendChild(footer);
    return face;
  }

  function createCard(card, index) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.index = String(index);
    btn.setAttribute(
      "aria-label",
      card.white.kanji + "（" + card.white.yomi + "）。タップで裏返す"
    );

    var inner = document.createElement("div");
    inner.className = "card-inner";
    inner.appendChild(createFace("front", card.white));
    inner.appendChild(createFace("back", card.black));
    btn.appendChild(inner);

    var autoTimer = null;

    function clearAuto() {
      if (autoTimer !== null) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function showWhite() {
      clearAuto();
      btn.classList.remove("is-flipped");
      btn.setAttribute(
        "aria-label",
        card.white.kanji + "（" + card.white.yomi + "）。タップで裏返す"
      );
    }

    function showBlack() {
      clearAuto();
      btn.classList.add("is-flipped");
      btn.setAttribute(
        "aria-label",
        card.black.kanji + "（" + card.black.yomi + "）。タップで表に戻す"
      );
      autoTimer = setTimeout(showWhite, AUTO_BACK_MS);
    }

    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-flipped")) {
        showWhite();
      } else {
        showBlack();
      }
    });

    return btn;
  }

  function render(cards) {
    grid.textContent = "";
    for (var i = 0; i < cards.length; i++) {
      grid.appendChild(createCard(cards[i], i));
    }
    setStatus(cards.length + " 枚");
  }

  function boot() {
    fetch(CSV_URL + "?t=" + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error("CSV を読めませんでした (" + res.status + ")");
        return res.text();
      })
      .then(function (text) {
        var cards = parseCsv(text);
        if (!cards.length) throw new Error("カードデータが空です");
        render(cards);
      })
      .catch(function (err) {
        setStatus(err.message || "読み込みに失敗しました", true);
      });
  }

  boot();
})();

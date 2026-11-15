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

    var mark = document.createElement("img");
    mark.className = "footer-mark";
    mark.src = "finger.png?v=14";
    mark.alt = "";
    mark.setAttribute("aria-hidden", "true");

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
    setStatus("");
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

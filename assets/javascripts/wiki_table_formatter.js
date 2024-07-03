(() => {
  if (typeof jsToolBar === "undefined") return;

  // Generate span for checking the string width
  const font = "2px monospace";
  const span = document.createElement("span");
  span.style.visibility = "hidden";
  span.style.position = "absolute";
  span.style.whiteSpace = "nowrap";
  span.style.font = font;

  function getTextWidth(text, span) {
    let width = 0;
    // Note: With the `20px monospace` setting, English characters measure 11px
    // and Japanese characters measure 20px. Therefore, with the `2px monospace`
    // setting, internally, English characters would be 1.1px and Japanese
    // characters 2px, but they appear to be rounded to English characters at
    // 1px and Japanese characters at 2px when retrieved.
    // Furthermore, when measuring the length of a string, five English
    // characters internally measure 5.5px, but the retrieved value rounds up
    // to 6px. Thus, by measuring the width of each character individually, one
    // can avoid errors due to cumulative rounding.

    // Note: `20px monospace` という設定では、英字: 11px, 日本語: 20px となるため、
    // `2px monospace` という設定では内部的には 英字: 1.1px, 日本語: 2px だが、
    // 丸めて 英字: 1px, 日本語: 2px として取得されている模様。
    // また、文字列として長さを測定すると、例えば英字5文字では内部的には 5.5px となる
    // が、取得される値は丸まって 6px となってしまう。
    // よって、1文字ずつ幅を測定することによって、積み上げと丸めによる誤差を回避する。

    [...text].forEach((t) => {
      span.textContent = t;
      width += t === " " ? 1 : span.clientWidth;
    });

    return width;
  }

  function isTable(text) {
    if (text.length === 0) return false;
    if (text[0] != "|") return false;
    if (text[text.length - 1] != "|") return false;

    const rows = text.split("\n");
    if (rows.length < 3) return false;

    const columnCounts = rows[0].split("|").length - 2;

    // Check column counts
    if (!rows.every((r) => r.split("|").length - 2 == columnCounts))
      return false;

    // Check separator row
    const separatorRow = rows[1].trim();
    if (!/^\|(:?-+:?\|)+$/.test(separatorRow)) return false;

    return true;
  }

  function formatTable(text) {
    const rows = text.split("\n");
    const columnCount = rows[0].split("|").length - 2;

    const separatorRowList = rows[1].split("|");
    let alignList = new Array(columnCount + 2).fill(0);
    for (let ic = 1; ic < columnCount + 1; ic++) {
      const separatorRow = separatorRowList[ic];
      alignList[ic] = separatorRow.startsWith(":")
        ? separatorRow.endsWith(":")
          ? "c"
          : "l"
        : separatorRow.endsWith(":")
        ? "r"
        : "l";
    }

    document.body.appendChild(span);
    const maxTextWidthList = new Array(columnCount + 2).fill(0);
    const cellWidthList = [];
    rows.forEach((r, ir) => {
      cellWidthList[ir] = [];
      r.split("|").forEach((cell, ic) => {
        if (ic > 0 && ic < columnCount + 1) {
          cellWidthList[ir][ic] = getTextWidth(cell.trim(), span);

          // Calculate the maximum text width without separator row
          if (ir !== 1) {
            maxTextWidthList[ic] = Math.max(
              maxTextWidthList[ic],
              cellWidthList[ir][ic]
            );
          }
        }
      });
    });
    document.body.removeChild(span);

    let formattedRows = [];
    for (let ir = 0; ir < rows.length; ir++) {
      const rowSplitted = rows[ir].split("|");
      for (let ic = 1; ic < columnCount + 1; ic++) {
        const cellWidth = cellWidthList[ir][ic];

        switch (alignList[ic]) {
          case "r":
            if (ir === 1) {
              rowSplitted[ic] = "-".repeat(maxTextWidthList[ic] + 1) + ":";
            } else {
              rowSplitted[ic] =
                " ".repeat(maxTextWidthList[ic] - cellWidth) +
                rowSplitted[ic].trim();
              rowSplitted[ic] = ` ${rowSplitted[ic]} `;
            }
            break;
          case "c":
            if (ir === 1) {
              rowSplitted[ic] = ":" + "-".repeat(maxTextWidthList[ic]) + ":";
            } else {
              const padStartLength = Math.floor(
                (maxTextWidthList[ic] - cellWidth) / 2
              );
              const padEndLength = Math.ceil(
                (maxTextWidthList[ic] - cellWidth) / 2
              );
              rowSplitted[ic] =
                " ".repeat(padStartLength) +
                rowSplitted[ic].trim() +
                " ".repeat(padEndLength);
              rowSplitted[ic] = ` ${rowSplitted[ic]} `;
            }
            break;
          default:
            if (ir === 1) {
              rowSplitted[ic] =
                rowSplitted[ic][0] + "-".repeat(maxTextWidthList[ic] + 1);
            } else {
              rowSplitted[ic] =
                rowSplitted[ic].trim() +
                " ".repeat(maxTextWidthList[ic] - cellWidth);
              rowSplitted[ic] = ` ${rowSplitted[ic]} `;
            }
        }
      }
      formattedRows[ir] = rowSplitted.join("|");
    }

    return formattedRows.join("\n");
  }

  function trimText(text) {
    const textTrimmedStart = text.trimStart();
    const textTrimmedEnd = text.trimEnd();

    const trimmedStart = text.slice(0, text.length - textTrimmedStart.length);
    const trimmedEnd = text.slice(textTrimmedEnd.length);

    return [text.trim(), trimmedStart, trimmedEnd];
  }

  // Add button to the jsToolBar.
  // Register button and functions to jsToolBar
  const tableFormattingButton = {
    type: "button",
    title: WikiTableFormatter.config.resources.text.buttonLabel,
    fn: {
      wiki: function () {
        const $jstBlock = $(this.toolbarBlock);

        const $textArea = $jstBlock.find(".jstEditor > textarea");

        if ($textArea.length === 0) {
          return false;
        }

        const textArea = $textArea[0];
        const text = textArea.value;
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const selected = text.substring(start, end);
        const [trimmedSelected, trimmedStart, trimmedEnd] = trimText(selected);

        if (!isTable(trimmedSelected)) {
          return false;
        }

        const formattedText = formatTable(trimmedSelected);

        // Update textarea
        textArea.setRangeText(trimmedStart + formattedText + trimmedEnd);

        // Move cursor
        textArea.selectionStart =
          start +
          trimmedStart.length +
          formattedText.length +
          trimmedEnd.length;
        textArea.selectionEnd = textArea.selectionStart;

        // Postprocessing
        $textArea.change().focus();
      },
    },
  };

  const jstbElements = {};
  for (const e in jsToolBar.prototype.elements) {
    jstbElements[e] = jsToolBar.prototype.elements[e];
    if (e === "table") {
      // Insert button after table button
      jstbElements["wiki_table_formatter"] = tableFormattingButton;
    }
  }
  jsToolBar.prototype.elements = jstbElements;
})();

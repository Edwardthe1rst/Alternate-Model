/* ============================================================
   books.js
   Loads books.json and renders one table per section into
   #sections-container.
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ───────────────────────────────────────────── */

  /**
   * Escape any HTML special characters in a string so that
   * user data is never interpreted as markup.
   */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Join an array into an HTML string, inserting a <br> after
   * every Nth item (1-based). The last item never gets a <br>.
   * Returns '—' for absent or empty arrays.
   */
  function listWithBreaks(arr, every) {
    if (!arr || arr.length === 0) return '—';
    return arr
      .map(function (item, i) {
        var s = esc(String(item));
        /* insert a break after this item if it lands on the interval
           AND it isn't the very last item in the array */
        if ((i + 1) % every === 0 && i < arr.length - 1) {
          s += '<br>';
        } else if (i < arr.length - 1) {
          s += ', ';
        }
        return s;
      })
      .join('');
  }

  /* Convenience wrappers for each column's cadence */
  function fmtChapters(arr)    { return listWithBreaks(arr, 4); }  /* break every 4th  */
  function fmtCharacters(arr)  { return listWithBreaks(arr, 2); }  /* break every 2nd  */
  function fmtEvery(arr)       { return listWithBreaks(arr, 1); }  /* break after each */

  /* ── Build one <tr> for a single book ─────────────────── */
  function buildBookRow(book) {
    const tr = document.createElement('tr');
    /* Use innerHTML directly so <br> tags are rendered, not escaped */
    tr.innerHTML = `
      <td class="col-book">${esc(book.book || '—')}</td>
      <td class="col-chapters col-list">${fmtChapters(book.key_chapters)}</td>
      <td class="col-list">${fmtCharacters(book.characters)}</td>
      <td class="col-list">${fmtEvery(book.events)}</td>
      <td class="col-list col-themes">${fmtEvery(book.themes)}</td>
    `;
    return tr;
  }

  /* ── Build one section block (header + table) ──────────── */
  function buildSection(sectionData) {
    /* Outer wrapper */
    const section = document.createElement('section');
    section.className = 'book-section';

    /* Section heading */
    const h2 = document.createElement('h2');
    h2.className = 'section-header';
    h2.textContent = sectionData.section || 'Untitled Section';
    section.appendChild(h2);

    /* Scrollable wrapper so table doesn't break narrow layouts */
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    /* Table */
    const table = document.createElement('table');
    table.className = 'books-table';

    /* Column widths */
    table.innerHTML = `
      <colgroup>
        <col class="cw-book" />
        <col class="cw-chapters" />
        <col class="cw-characters" />
        <col class="cw-events" />
        <col class="cw-themes" />
      </colgroup>
      <thead>
        <tr>
          <th>Book</th>
          <th>Key Chapters</th>
          <th>Characters</th>
          <th>Events</th>
          <th>Themes</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');

    const books = Array.isArray(sectionData.books) ? sectionData.books : [];
    books.forEach(function (book) {
      tbody.appendChild(buildBookRow(book));
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    section.appendChild(wrap);

    return section;
  }

  /* ── Render all sections into the container ─────────────── */
  function render(data) {
    const container = document.getElementById('sections-container');
    const loader    = document.getElementById('loading-state');

    /* Remove the loading placeholder */
    if (loader) loader.remove();

    /* Update the document title if the JSON provides one */
    if (data.title) {
      document.title = data.title;
      const titleEl = document.getElementById('doc-title');
      if (titleEl) titleEl.textContent = data.title;
    }

    /* Guard against missing or empty sections array */
    const sections = Array.isArray(data.sections) ? data.sections : [];
    if (sections.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'error-state';
      msg.textContent = 'No sections found in books.json.';
      container.appendChild(msg);
      return;
    }

    /* Build and append one block per section */
    sections.forEach(function (sectionData) {
      container.appendChild(buildSection(sectionData));
    });
  }

  /* ── Show a user-facing error ────────────────────────────── */
  function showError(message) {
    const container = document.getElementById('sections-container');
    const loader    = document.getElementById('loading-state');
    if (loader) loader.remove();

    const msg = document.createElement('p');
    msg.className = 'error-state';
    msg.textContent = message;
    container.appendChild(msg);
  }

  /* ── Fetch books.json and kick everything off ────────────── */
  fetch('books.json')
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          'Could not load books.json — HTTP ' + response.status + ' ' + response.statusText
        );
      }
      return response.json();
    })
    .then(function (data) {
      render(data);
    })
    .catch(function (err) {
      console.error('[books.js]', err);
      showError(
        'Failed to load books.json. ' +
        'Make sure the file is in the same directory and the page is served over HTTP (not opened as a local file). ' +
        'Details: ' + err.message
      );
    });

})();
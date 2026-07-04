/**
 * Autocomplete UI component.
 *
 * Wraps an existing <input> element and adds a dropdown with search results
 * fetched from the API manager.  Designed to be attached to title inputs in
 * step-2.
 *
 * Usage:
 *   import { attachAutocomplete } from "./ui/autocomplete/autocomplete.js";
 *   attachAutocomplete(document.getElementById("movie-title"), "movie");
 *
 * When the user picks a result:
 *   1. The input value is set to the selected title.
 *   2. A callback is fired with the result object (so step-3 can set COVER).
 */

import { apiManager } from "../../api/api-manager.js";

// ---- Public API ----

/**
 * Attach autocomplete behaviour to a text input.
 *
 * @param {HTMLInputElement} inputEl    - The <input> to enhance
 * @param {string}          mediaType  - e.g. "movie", "tv", "game", "music", "book"
 * @param {object}          [options]
 * @param {function}        [options.onSelect] - Called with the chosen result object
 * @returns {{ destroy: function }} - Call destroy() to remove the autocomplete
 */
export function attachAutocomplete(inputEl, mediaType, options = {}) {
    if (!inputEl || !mediaType) {
        return { destroy() {} };
    }

    // Bail out if no provider is available for this type
    if (!apiManager.hasProviders(mediaType)) {
        return { destroy() {} };
    }

    const { onSelect } = options;

    // ---- DOM setup ----
    const wrapper = document.createElement("div");
    wrapper.className = "autocomplete-wrapper";

    const dropdown = document.createElement("ul");
    dropdown.className = "autocomplete-dropdown";
    dropdown.setAttribute("role", "listbox");

    inputEl.parentNode.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);
    wrapper.appendChild(dropdown);

    // Enhance input for autocomplete
    inputEl.setAttribute("autocomplete", "off");
    inputEl.setAttribute("aria-autocomplete", "list");
    inputEl.setAttribute("aria-expanded", "false");

    // ---- State ----
    let results = [];
    let activeIndex = -1;
    let debounceTimer = null;
    let abortController = null;

    // ---- Event listeners ----

    inputEl.addEventListener("input", onInput);
    inputEl.addEventListener("keydown", onKeyDown);
    inputEl.addEventListener("focus", onFocus);
    document.addEventListener("click", onClickOutside, true);

    function onInput() {
        const query = inputEl.value.trim();
        if (query.length < 2) {
            closeDropdown();
            return;
        }
        scheduleSearch(query);
    }

    function onFocus() {
        if (results.length && !dropdown.classList.contains("visible")) {
            openDropdown();
        }
    }

    function onKeyDown(e) {
        if (!dropdown.classList.contains("visible")) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                moveHighlight(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                moveHighlight(-1);
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < results.length) {
                    selectResult(results[activeIndex]);
                }
                break;
            case "Escape":
                closeDropdown();
                break;
        }
    }

    function onClickOutside(e) {
        if (!wrapper.contains(e.target)) {
            closeDropdown();
        }
    }

    // ---- Search logic ----

    function scheduleSearch(query) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => doSearch(query), 600);
    }

    async function doSearch(query) {
        // Cancel any in-flight request
        if (abortController) abortController.abort();
        abortController = new AbortController();

        try {
            results = await apiManager.search(mediaType, query);
            console.debug("[Autocomplete] results:", results.length, "items");
            activeIndex = -1;

            if (results.length && document.activeElement === inputEl) {
                renderDropdown();
                openDropdown();
            } else {
                closeDropdown();
            }
        } catch {
            closeDropdown();
        }
    }

    // ---- Dropdown rendering ----

    function renderDropdown() {
        dropdown.innerHTML = results
            .map(
                (item, i) => `
                <li class="autocomplete-item${item.searchReturnsImage === false ? ' no-thumb' : ''}"
                    role="option"
                    id="ac-item-${i}"
                    data-index="${i}">
                    ${item.searchReturnsImage !== false
                        ? (item.poster
                            ? `<img class="ac-thumb" src="${item.poster}" alt="" loading="lazy" />`
                            : `<span class="ac-thumb ac-thumb-placeholder"></span>`)
                        : ''
                    }
                    <div class="ac-text">
                        <span class="ac-title">${escapeHtml(item.title)}</span>
                        ${item.subtitle
                            ? `<span class="ac-subtitle">${escapeHtml(item.subtitle)}</span>`
                            : ""
                        }
                    </div>
                </li>`
            )
            .join("");

        // Click handler on each item
        dropdown.querySelectorAll(".autocomplete-item").forEach(li => {
            li.addEventListener("mousedown", e => {
                e.preventDefault(); // prevent input blur before click fires
                const idx = parseInt(li.dataset.index);
                selectResult(results[idx]);
            });
        });
    }

    function openDropdown() {
        dropdown.classList.add("visible");
        inputEl.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
        dropdown.classList.remove("visible");
        inputEl.setAttribute("aria-expanded", "false");
        results = [];
        activeIndex = -1;
    }

    function moveHighlight(delta) {
        // Remove previous
        if (activeIndex >= 0) {
            const prev = dropdown.querySelector(`#ac-item-${activeIndex}`);
            if (prev) prev.classList.remove("active");
        }

        activeIndex = Math.max(0, Math.min(results.length - 1, activeIndex + delta));

        const next = dropdown.querySelector(`#ac-item-${activeIndex}`);
        if (next) {
            next.classList.add("active");
            next.scrollIntoView({ block: "nearest" });
        }
    }

    function selectResult(item) {
        inputEl.value = item.title;
        closeDropdown();

        if (onSelect) {
            onSelect(item);
        }
    }

    // ---- Cleanup ----

    function destroy() {
        clearTimeout(debounceTimer);
        if (abortController) abortController.abort();
        inputEl.removeEventListener("input", onInput);
        inputEl.removeEventListener("keydown", onKeyDown);
        inputEl.removeEventListener("focus", onFocus);
        document.removeEventListener("click", onClickOutside, true);
        inputEl.removeAttribute("aria-autocomplete");
        inputEl.removeAttribute("aria-expanded");

        // Move input back to parent
        if (wrapper.parentNode) {
            wrapper.parentNode.insertBefore(inputEl, wrapper);
            wrapper.remove();
        }
    }

    return { destroy };
}

// ---- Helpers ----

function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

let USER_LANGUAGE;
let LANGUAGE_PACK;

export async function loadUserLanguage() {
    initUserLanguage();
    await loadLanguagePack();
    translatePage();
    loadLanguageSelector();
}

export function translate(key, replacements = {}, strict = true) {
    if (!LANGUAGE_PACK) return "";
    let result = searchObject(LANGUAGE_PACK, key, strict);

    if (result == null) {
        if (strict) {
            console.warn(`Translation key "${key}" not found in language pack. Using key as fallback.`);
            MISSING_TRANSLATIONS.add(key);
        }
        return key;
    }

    if (Object.keys(replacements).length > 0) {
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
        }
    }

    return result;
}

function loadLanguageSelector() {
    document.getElementById('user-language').src = `assets/icons/language/${USER_LANGUAGE}.svg`

    const langOptions = document.querySelector('.language-options');
    document.querySelector('.language-button').addEventListener('click', () => {
        langOptions.classList.toggle('show');
    });

    for (const option of document.querySelectorAll('.language-option')) {
        const lang = option.getAttribute("data-lang")
        option.addEventListener('click', () => updateUserLanguage(lang));
        if (lang == USER_LANGUAGE) {
            option.style.display = 'none';
        }
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-selector')) {
            langOptions.style.display = 'none';
        }
    });
}

async function loadLanguagePack() {
    try {
        const response = await fetch(`./assets/language/${USER_LANGUAGE}.json`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        LANGUAGE_PACK = await response.json();
    } catch (error) {
        console.error("Error fetching language pack:", error);
    }
}

function initUserLanguage() {
    let language = localStorage.getItem("userLanguage");
    if (!language) {
        language = navigator.language || navigator.userLanguage;
        language = language.split("-")[0];
    }

    if (!["en", "pt"].includes(language)) {
        console.warn(`Unsupported language "${language}". Defaulting to "en".`);
        language = "en";
    }

    if (language != localStorage.getItem("userLanguage")) {
        localStorage.setItem("userLanguage", language);
    }

    USER_LANGUAGE = language;
}

function updateUserLanguage(language) {
    const previousLang = localStorage.getItem("userLanguage");
    localStorage.setItem("userLanguage", language);

    if (previousLang !== language) {
        window.location.reload();
    }
}

function searchObject(obj, key, strict = true) {
    const keys = key.split(".");
    let result = obj;

    for (const k of keys) {
        if (result && k in result) {
            result = result[k];
        } else {
            return strict ? null : key;
        }
    }

    const type = typeof result;
    if (type != "string") {
        console.error(`Invalid search value for key "${key}": expected a string, got ${type}.`);
        return "";
    }

    return result;
}

function translatePage() {
    const elements = document.querySelectorAll("[data-translate]");
    for (const element of elements) {
        const key = element.getAttribute("data-translate");
        if (key) {
            const translation = translate(key);
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    }
}
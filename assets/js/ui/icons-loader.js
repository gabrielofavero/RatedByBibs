/**
 * Fetches the external brands.svg sprite and injects all its symbols
 * into the inline hidden SVG sprite. This allows using fast #icon-name
 * references while keeping the HTML lightweight.
 */
let loaded = false;

export async function loadBrandIcons() {
    if (loaded) return;
    
    try {
        const response = await fetch('assets/icons/brands.svg');
        if (!response.ok) return;
        
        const svgText = await response.text();
        const hiddenSprite = document.querySelector('svg[style*="display: none"]');
        if (!hiddenSprite) return;
        
        // Extract just the <symbol> elements as raw HTML
        const symbolMatch = svgText.match(/<symbol[\s\S]*<\/symbol>/g);
        if (symbolMatch) {
            hiddenSprite.insertAdjacentHTML('beforeend', symbolMatch.join(''));
        }
        
        loaded = true;
    } catch (err) {
        console.warn('Failed to load brand icons:', err);
    }
}

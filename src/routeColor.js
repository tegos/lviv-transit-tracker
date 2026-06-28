// Deterministic color picker: same route code always maps to the same color.
export function colorForCode(code, colors) {
    const s = String(code);
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) | 0;
    }
    return colors[Math.abs(hash) % colors.length];
}

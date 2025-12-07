export async function loadTerms() {
    const res = await fetch("../data/terms.csv");
    const text = await res.text();

    return text
        .split("\n")
        .map(r => r.trim())
        .filter(Boolean)
        .map(r => r.split(",")[0]); 
}

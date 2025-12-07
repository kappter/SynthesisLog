export async function getAISuggestion(term, step) {
    try {
        const res = await fetch("https://your-ai-proxy-url/api/ai-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                term,
                step
            })
        });

        const data = await res.json();
        return data.text;
    } catch (e) {
        return "(AI unavailable — write your own insight here.)";
    }
}

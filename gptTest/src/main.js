import { loadTerms } from "./termBank.js";
import { CycleState } from "./cycleState.js";
import { updateDial, setCurrentTerm, setResponseText } from "./uiRenderer.js";
import { getAISuggestion } from "./aiModule.js";

let cycle;

async function init() {
    const terms = await loadTerms();
    cycle = new CycleState(terms);

    // First term
    setCurrentTerm(cycle.currentTerm());
}

document.getElementById("advanceBtn").onclick = () => {
    const text = document.getElementById("response-box").value.trim();
    if (text) {
        cycle.recordResponse(text);
        setResponseText("");
    }

    cycle.next();
    updateDial(cycle.step);
    setCurrentTerm(cycle.currentTerm());
};

document.getElementById("aiSuggest").onclick = async () => {
    const suggestion = await getAISuggestion(
        cycle.currentTerm(),
        cycle.step
    );
    setResponseText(suggestion);
};

document.getElementById("exportBtn").onclick = () => {
    const json = cycle.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "synthesislog.json";
    a.click();
};

document.getElementById("importFile").onchange = async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    cycle.importJSON(text);
};

init();

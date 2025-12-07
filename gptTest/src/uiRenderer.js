export function updateDial(step) {
    const dial = document.getElementById("dial");
    dial.style.transform = `rotate(${step * 90}deg)`;
}

export function setCurrentTerm(term) {
    document.getElementById("current-term").textContent = term;
}

export function setResponseText(text) {
    document.getElementById("response-box").value = text;
}

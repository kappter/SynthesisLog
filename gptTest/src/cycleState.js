export class CycleState {
    constructor(terms) {
        this.terms = terms;
        this.index = 0;
        this.step = 0;

        this.history = [];
    }

    next() {
        this.step = (this.step + 1) % 4;

        if (this.step === 0) {
            this.index = Math.floor(Math.random() * this.terms.length);
        }

        return this.currentTerm();
    }

    currentTerm() {
        return this.terms[this.index];
    }

    recordResponse(text) {
        this.history.push({
            term: this.currentTerm(),
            step: this.step,
            text,
            timestamp: Date.now()
        });
    }

    exportJSON() {
        return JSON.stringify(this.history, null, 2);
    }

    importJSON(json) {
        this.history = JSON.parse(json);
    }
}

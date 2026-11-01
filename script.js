
const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");
const displayNote = document.getElementById("displayNote");
const historyList = document.getElementById("historyList");

let currentInput = "0";
let expression = "";
let history = [];
let justCalculated = false;
let errorState = false;

// Update calculator screen
function updateDisplay() {
    display.textContent = currentInput;
    expressionDisplay.textContent = expression;
}

// Clear calculator
function clearCalculator() {
    currentInput = "0";
    expression = "";
    justCalculated = false;
    errorState = false;
    displayNote.textContent = "Ready to calculate";
    updateDisplay();
}

// Add a number or decimal point
function appendValue(value) {
    if (errorState) {
        clearCalculator();
    }

    if (justCalculated) {
        currentInput = "0";
        expression = "";
        justCalculated = false;
    }

    if (value === ".") {
        if (!currentInput.includes(".")) {
            currentInput += ".";
        }
    } else {
        if (currentInput === "0") {
            currentInput = value;
        } else if (currentInput === "-0") {
            currentInput = "-" + value;
        } else {
            currentInput += value;
        }
    }

    displayNote.textContent = "Entering number";
    updateDisplay();
}

// Add an operator
function appendOperator(operator) {
    if (errorState) return;

    if (justCalculated) {
        expression = currentInput;
        justCalculated = false;
    }

    if (currentInput === "-" || currentInput === "") return;

    expression += currentInput + operator;
    currentInput = "0";

    displayNote.textContent = "Operator selected";
    updateDisplay();
}

// Delete last character
function deleteLast() {
    if (errorState || justCalculated) {
        clearCalculator();
        return;
    }

    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0";
    }

    updateDisplay();
}

// Change positive to negative or negative to positive
function changeSign() {
    if (errorState) return;

    if (currentInput !== "0") {
        currentInput = currentInput.startsWith("-")
            ? currentInput.slice(1)
            : "-" + currentInput;
    }

    justCalculated = false;
    updateDisplay();
}

// Percentage
function calculatePercentage() {
    if (errorState) return;

    const number = Number(currentInput);

    if (!Number.isFinite(number)) return;

    currentInput = String(number / 100);
    justCalculated = false;
    updateDisplay();
}

// Tokenize expression
function tokenize(input) {
    const tokens = input.match(
        /(?:\d+\.?\d*|\.\d+)|[+\-*/]/g
    );

    if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
        throw new Error("Invalid expression");
    }

    return tokens;
}

// Mathematical parser with operator precedence
function calculate(input) {
    const tokens = tokenize(input);
    let position = 0;

    function parseNumber() {
        let sign = 1;

        if (tokens[position] === "-") {
            sign = -1;
            position++;
        } else if (tokens[position] === "+") {
            position++;
        }

        const token = tokens[position];

        if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
            throw new Error("Invalid number");
        }

        position++;
        return sign * Number(token);
    }

    function parseMultiplication() {
        let value = parseNumber();

        while (
            tokens[position] === "*" ||
            tokens[position] === "/"
        ) {
            const operator = tokens[position];
            position++;

            const next = parseNumber();

            if (operator === "*") {
                value *= next;
            } else {
                if (next === 0) {
                    throw new Error("Cannot divide by zero");
                }
                value /= next;
            }
        }

        return value;
    }

    function parseAddition() {
        let value = parseMultiplication();

        while (
            tokens[position] === "+" ||
            tokens[position] === "-"
        ) {
            const operator = tokens[position];
            position++;

            const next = parseMultiplication();

            if (operator === "+") {
                value += next;
            } else {
                value -= next;
            }
        }

        return value;
    }

    const result = parseAddition();

    if (position !== tokens.length || !Number.isFinite(result)) {
        throw new Error("Invalid calculation");
    }

    return Number(result.toPrecision(12));
}

// Save result in history
function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML =
            '<p class="empty-history">Your calculations will appear here.</p>';
        return;
    }

    historyList.innerHTML = "";

    history.forEach(item => {
        const row = document.createElement("div");
        row.className = "history-item";

        const left = document.createElement("span");
        left.className = "history-expression";
        left.textContent = item.expression;

        const right = document.createElement("span");
        right.className = "history-result";
        right.textContent = item.result;

        row.appendChild(left);
        row.appendChild(right);
        historyList.appendChild(row);
    });
}

// Calculate final result
function calculateResult() {
    if (errorState) return;

    const fullExpression = expression + currentInput;

    if (!fullExpression || fullExpression === "0") return;

    try {
        const answer = calculate(fullExpression);

        history.unshift({
            expression: fullExpression,
            result: String(answer)
        });

        history = history.slice(0, 20);
        renderHistory();

        expression = fullExpression + " =";
        currentInput = String(answer);

        justCalculated = true;
        errorState = false;

        displayNote.textContent = "Calculation complete";
        updateDisplay();

    } catch (error) {
        currentInput = "Error";
        expression = "";
        errorState = true;
        justCalculated = false;

        displayNote.textContent =
            error.message === "Cannot divide by zero"
                ? "Cannot divide by zero"
                : "Invalid calculation";

        updateDisplay();
    }
}

// Button actions
document.querySelectorAll(".key").forEach(button => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;
        const action = button.dataset.action;

        if (value !== undefined) {
            if ("+-*/".includes(value)) {
                appendOperator(value);
            } else {
                appendValue(value);
            }
            return;
        }

        switch (action) {
            case "clear":
                clearCalculator();
                break;

            case "delete":
                deleteLast();
                break;

            case "percent":
                calculatePercentage();
                break;

            case "sign":
                changeSign();
                break;

            case "calculate":
                calculateResult();
                break;
        }
    });
});

// Keyboard support
document.addEventListener("keydown", event => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        appendValue(key);
    } else if ("+-*/".includes(key)) {
        appendOperator(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculateResult();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearCalculator();
    } else if (key === "%") {
        calculatePercentage();
    }
});

// Clear history
document.getElementById("clearHistory").addEventListener("click", () => {
    history = [];
    renderHistory();
});

// Initial screen
updateDisplay();
renderHistory();

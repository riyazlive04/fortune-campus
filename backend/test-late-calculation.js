
function calculatePercentage(present, late, absent) {
    const total = present + late + absent;
    const effectivePresent = present + (late * 0.5);
    return total > 0 ? Math.round((effectivePresent / total) * 100) : 0;
}

const testCases = [
    { present: 1, late: 0, absent: 0, expected: 100 },
    { present: 0, late: 1, absent: 0, expected: 50 },
    { present: 0, late: 0, absent: 1, expected: 0 },
    { present: 1, late: 1, absent: 0, expected: 75 },
    { present: 1, late: 0, absent: 1, expected: 50 },
    { present: 1, late: 1, absent: 1, expected: 50 }, // 1.5 / 3 = 0.5
    { present: 2, late: 1, absent: 1, expected: 63 }, // 2.5 / 4 = 0.625 -> 63
    { present: 10, late: 2, absent: 0, expected: 92 }, // 11 / 12 = 0.916... -> 92
];

console.log("Running Attendance Calculation Tests...");
testCases.forEach((tc, i) => {
    const actual = calculatePercentage(tc.present, tc.late, tc.absent);
    if (actual === tc.expected) {
        console.log(`Test ${i + 1} PASSED: P:${tc.present} L:${tc.late} A:${tc.absent} -> ${actual}%`);
    } else {
        console.error(`Test ${i + 1} FAILED: P:${tc.present} L:${tc.late} A:${tc.absent} -> Expected ${tc.expected}%, Actual ${actual}%`);
    }
});

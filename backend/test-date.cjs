const year = 2026;
const month = 3; // March
const startDate = new Date(Number(year), Number(month) - 1, 1);
const endDate = new Date(Number(year), Number(month), 0);
console.log('Start:', startDate);
console.log('End:', endDate);

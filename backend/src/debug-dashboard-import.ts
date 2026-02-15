
try {
    console.log('Attempting to import student.dashboard.routes.ts...');
    require('./modules/students/student.dashboard.routes');
    console.log('Success: student.dashboard.routes.ts imported.');
} catch (error) {
    console.error('Error importing student.dashboard.routes.ts:', error);
}

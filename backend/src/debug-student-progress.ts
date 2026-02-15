
try {
    console.log('Attempting to import student.progress.controller.ts...');
    require('./modules/students/student.progress.controller');
    console.log('Success: student.progress.controller.ts imported.');
} catch (error) {
    console.error('Error importing student.progress.controller.ts:', error);
}

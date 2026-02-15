
try {
    console.log('Attempting to import student.routes.ts...');
    require('./modules/students/student.routes');
    console.log('Success: student.routes.ts imported.');
} catch (error) {
    console.error('Error importing student.routes.ts:', error);
}

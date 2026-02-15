
try {
    console.log('Attempting to import test.management.controller.ts...');
    require('./modules/trainers/test.management.controller');
    console.log('Success: test.management.controller.ts imported.');
} catch (error) {
    console.error('Error importing test.management.controller.ts:', error);
}

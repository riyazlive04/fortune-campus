
try {
    console.log('Attempting to import trainer.routes.ts...');
    require('./modules/trainers/trainer.routes');
    console.log('Success: trainer.routes.ts imported.');
} catch (error) {
    console.error('Error importing trainer.routes.ts:', error);
}

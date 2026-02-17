
import { batchesApi, storage } from './lib/api';

console.log('Testing api.ts exports...');

try {
    console.log('Storage available:', !!storage);
    console.log('batchesApi available:', !!batchesApi);
    console.log('batchesApi keys:', Object.keys(batchesApi));
} catch (e) {
    console.error('Error importing api:', e);
}

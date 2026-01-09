const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('Paste the following keys into your .env.local file:');
console.log('---------------------------------------------------');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('---------------------------------------------------');

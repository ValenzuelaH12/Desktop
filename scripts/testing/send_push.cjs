/**
 * SCRIPT PARA ENVIAR NOTIFICACIONES PUSH DESDE EL SERVIDOR (NODE.JS)
 * 
 * Requisitos: npm install web-push
 */
const webpush = require('web-push');

// 1. Configurar tus llaves VAPID
const publicVapidKey = 'BL9KSv9l2_Zf9Of0xfdUQY9t5UiBX22Vc8cRDXV24hlK-dZOCJHf0t3al4oe8rDoFNp8kW3FccOqRKRjblw4I-k';
const privateVapidKey = 'PMiFIDdPTJco42NMOqgehK-R7iDrAKPm_CT-EF0-FKk';

webpush.setVapidDetails(
  'mailto:soporte@vsuite.com',
  publicVapidKey,
  privateVapidKey
);

// 2. Aquí va el objeto de suscripción que copiaste de la App (V-Push Token)
const pushSubscription = {"endpoint":"https://fcm.googleapis.com/fcm/send/dwixpMnGGKo:APA91bHRAEoL5B0d-EZ2_YaYzi4xgWHrsHySQOb-JV-Bhyr0uEUsubW5cPwgZeuid22hZiNLBPEXF63fwPW3i35hySc5Ni3LSFOTua14A4e4IhyGKoV_N2A-Ljzd7CKIRUe-1wBQO_ic","expirationTime":null,"keys":{"p256dh":"BKoBG8wePQPns8dq-2j2VHgzYukKHa7B5gIMksliU37ZhDWdKyc8H4RRzaXKd8E1nGv_OM6v96leUv5kzfmq0OU","auth":"x9DThVtHf1EIU4vpwuON9A"}};

// 3. Contenido de la notificación
const payload = JSON.stringify({
  title: '🚀 ALERTA DE SISTEMA V-NEXUS',
  body: 'Incidencia crítica en Habitación 101. ¡Atención inmediata!',
  icon: '/pwa-192x192.png',
  data: { url: '/incidencias' }
});

// 4. Enviar notificación
webpush.sendNotification(pushSubscription, payload)
  .then(result => console.log('✅ Notificación enviada con éxito:', result.statusCode))
  .catch(error => console.error('❌ Error enviando notificación:', error));

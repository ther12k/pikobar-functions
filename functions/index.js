const functions = require('firebase-functions');
const admin = require('firebase-admin');
const updateStatistics = require('./updateStatistics');
const cors = require('cors')({origin: true});
const axios = require('axios');

admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.getUserById = functions.https.onRequest(async (request, response) => {
  try {
    const uid = request.query.id;

    const dbRecord = await admin.firestore()
      .collection(`users`)
      .doc(uid)
      .get();

    const dbData = dbRecord.data();

    const userRecord = {
      id: dbData.id,
      name: dbData.name,
      gender: dbData.gender,
      email: dbData.email,
      photo_url: dbData.photo_url,
      province_code: dbData.province_id,
      city_code: dbData.city_id,
    }

    return response.send(userRecord);
  } catch (error) {
    return response.status(500).send("Error.");
  }
});

exports.postChatApiIncoming = functions.https.onRequest(async (request, response) => {
  const requestData = request.body;
  const requestToken = request.query.token;
  const token = functions.config().chatapi.token;
  const baseUrl = functions.config().chatapi.baseurl;
  
  try {
    const chatId = requestData.messages[0].chatId;
    const fromMe = requestData.messages[0].fromMe;

    if (fromMe === true) {
      console.log("OK, Incoming from me. ChatID ", chatId);

      return response.send("OK, Incoming from me. ChatID " + chatId);
    }

    await axios({
      method: 'post',
      url: `${baseUrl}/sendMessage?token=${token}`,
      data: {
        chatId: chatId,
        body: 'Ini adalah pesan otomatis layanan notifikasi PIKOBAR Pusat Informasi dan Koordinasi COVID-19 Jawa Barat. Untuk informasi dan pertanyaan lebih lanjut, Anda bisa menghubungi Hotline Call Center di nomor WA 08112093306\n\n' +
        'Pertanyaan dan informasi situasi perkembangan COVID-19 di Jawa Barat, dapat diakses melalui:\n'+
        'Whatsapp: 08112093306\n' +
        'Website: https://pikobar.jabarprov.go.id\n' +
        'Aplikasi Android: https://bit.ly/PIKOBAR-V1'
      }
    });

    await axios({
      method: 'post',
      url: `${baseUrl}/sendVCard?token=${token}`,
      data: {
        chatId: chatId,
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN;CHARSET=UTF-8:Dinas Kesehatan Provinsi Jawa Barat\nN;CHARSET=UTF-8:;Dinas Kesehatan Provinsi Jawa Barat;;;\nTEL;TYPE=CELL:+628112093306\nTEL;TYPE=WORK,VOICE:119\nURL;CHARSET=UTF-8:https://pikobar.jabarprov.go.id\nNOTE;CHARSET=UTF-8:Hotline Call Center PIKOBAR Pusat Informasi dan Koordinasi COVID-19 Jawa Barat\nEND:VCARD'
      }
    });

    console.log("OK. ChatID ", chatId);

    return response.send("OK. ChatID " + chatId);
  } catch (error) {
    console.log("Error. ChatID ", chatId);

    return response.status(500).send("Error. ChatID "  + chatId);
  }
});

exports.storeUser = functions.auth.user().onCreate((user) => {
  console.log('User:', user);

  const record = {
    id: user.uid,
    name: user.displayName,
    email: user.email,
    photo_url: user.photoURL,
    phone_number: user.phoneNumber,
    created_at: admin.firestore.Timestamp.now(),
    health_status: null,
    health_status_text: null,
    health_status_check: null
  }

  admin.firestore()
    .collection(`users`)
    .doc(user.uid)
    .set(record);

  return 'ok';
});

exports.deleteUser = functions.auth.user().onDelete((user) => {
  console.log('User:', user);

  admin.firestore()
    .collection(`users`)
    .doc(user.uid)
    .delete();

  return 'ok';
});

exports.autoSubscribeTopic = functions.firestore.document(`tokens/{tokenId}`).onCreate(async (snap, context) => {
  var tokenId = context.params.tokenId;

  var token = snap.data();
  console.log('Token:', token);

  admin.messaging().subscribeToTopic(tokenId, 'general');

  return 'ok';
});

exports.updateStatistics = updateStatistics.updateStatistics;

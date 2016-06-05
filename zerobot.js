/*=============================================
=       ZeroInside bot on Telegram            =
=============================================*/
/*=====  Author : Satrya Budi Pratama  ======*/
/*=============================================
=            Date : 11 May 2016               =
=============================================*/
/* 	github.com/noczero/ZerBotv2 */

var bb = require ('bot-brother');
var texts = require ('./texts.js');

var PrayerTimes = require('prayer-times'),
	Sholat = new PrayerTimes();

var now = Date.now();

var bot = bb({
	key : '211504778:AAErCs7jeVMcs33LgAsVTfuJ9tuexCBBkvE',
	redis : {port : 6379, host : '127.0.0.1'}
})
.texts(texts.default)
//Keyboard
.keyboard([

	[{'button.jadwal' : {go : 'jadwal' }}],
	[{'button.sholat' : {go : 'sholat' }}],
	[{'button.tugas' : {go : 'tugas' }}],
	[{'button.data' : {go : 'data' }}],
	[{'button.map' : {go : 'maptelkom' }}],
	[{'button.help' : {go : 'help' }}]
	
])
.keyboard('backButton', [
  [{
    'button.back': {
      handler: function (ctx) {
        return ctx.goBack();
      },
      isShown: function (ctx) {
        return !ctx.hideBackButton;
      }
    }
  }]
])
.use('before', bb.middlewares.typing())
.use('before', bb.middlewares.botanio('_Gd-VqRES69dQXgcby0o7bG8GulTdx9g'))
.use('before', function (ctx) {
	var now = Date.now();

});


// 	ctx.session.notifications = ctx.session.notifications || [];
//   	ctx.session.notifications = ctx.session.notifications.filter(function (n) {
//     return n.ts * 1e3 >= now - 30e3;
// // });
//   ctx.notifications = ctx.session.notifications;
//   ctx.session.notificationsCounter = ctx.session.notificationsCounter || 0;

//   ctx.data.user = ctx.meta.user;
//  // ctx.data.totalCount =  ctx.notifications.length;
//   ctx.session.createDate = ctx.session.createDate || Date.now();
// });

bot.listenUpdates();


//Command ZeroBot
console.log('ZeroBotV2 Started');
bot.command('hi')
	.invoke(function (ctx) {
	ctx.data.user = ctx.meta.user;
	//Return
	return ctx.sendMessage('Hello <%=user.first_name%>, How are you?');
	ctx.hideKeyboard();
})
.answer( function(ctx) {
	ctx.data.answer = ctx.answer;
	//Return 
	return ctx.sendMessage('OK. I understood. You fell <%=answer%>');
});

bot.command('jadwal', {compilantKeyboard : true})
	.invoke(function (ctx) {
		var oneDay = 24*60*60*1000;
		var now = new Date();
		var tglMasuk = new Date(2016,08,22);
		var hitungTgl = Math.round(Math.abs((now.getTime() - tglMasuk.getTime())/(oneDay)));
		ctx.data.sisamasuk = hitungTgl;
		return ctx.sendMessage('main.info')
	})
	.keyboard([
		[{'button.senin' : {go : 'senin'}}],
		[{'button.selasa' : {go : 'selasa'}}],
		[{'button.rabu' : {go : 'rabu'}}],
		[{'button.kamis' : {go : 'kamis'}}],
		[{'button.jumat' : {go : 'jumat'}}],
		[{'button.sabtu' : {go : 'sabtu'}}],
		'backButton'
	])

bot.command('senin', {compilantKeyboard : true})
	.invoke(function (ctx) {
	return ctx.sendMessage('main.senin');
	ctx.repeat();
});

bot.command('selasa', {compilantKeyboard : true})
	.invoke(function (ctx) {
	return ctx.sendMessage('main.selasa');
});

bot.command('rabu', {compilantKeyboard : true})
	.invoke(function (ctx) {
	return ctx.sendMessage('main.rabu');
});


bot.command('kamis', {compilantKeyboard : true})
	.invoke(function (ctx) {
	return ctx.sendMessage('main.kamis');
});

bot.command('jumat', {compilantKeyboard : true})
	.invoke(function (ctx) {
	return ctx.sendMessage('main.jumat');
});

bot.command('sabtu', {compilantKeyboard : true})
	.invoke(function (ctx) {
	return ctx.sendMessage('main.sabtu');
});

bot.command('help' , {compilantKeyboard : true})
	.invoke(function (ctx) {
		return ctx.sendMessage('main.help');
});
bot.command('tugas' , {compilantKeyboard : true})
	.invoke(function (ctx) {
		return ctx.sendMessage('main.notfound');
});
bot.command('sholat' , {compilantKeyboard : true})
	 .use('before', function(ctx) {
	var oneDay = 24*60*60*1000;
	var idulfitri = new Date(2016,06,06);
	var waktu = new Date();
	var toIdulFitri = Math.round(Math.abs((waktu.getTime() - idulfitri.getTime())/(oneDay)));
	ctx.data.ied = toIdulFitri;
	ctx.data.localtime = waktu;
 	ctx.data.waktusholat = Sholat.getTimes(waktu, [6.9719, 107.6127], 'auto', 'auto' );
 	ctx.data.latitude = '6.9719';
 	ctx.data.longitude = '107.6127';
	Sholat.setMethod('ISNA');
	Sholat.tune({
		sunrise : - 1,
		fajr : 1 ,
		dhuhr : 2 ,
		asr : 4 ,
		maghrib : -15,
		isha : -4,
		sunset : -15
		});
	 })

	.invoke(function (ctx) {
		return ctx.sendMessage('main.sholat');
});

bot.command('maptelkom' , {compilantKeyboard : true})
	.invoke(function (ctx) {
		return ctx.sendLocation(-6.974402 , 107.631733);
	});


bot.command('data', {compilantKeyboard : true})
	// .use('before', function(ctx) {
	// 	ctx.sendMessage('Let me know your name');
	// })

	.invoke(function (ctx) {
		ctx.hideKeyboard();
		return ctx.sendMessage('Let me know the name.');

	})
	.answer(function (ctx) {
		ctx.session.name = ctx.answer;
		//return ctx.sendMessage(ctx.session.name);
	switch (ctx.session.name)
	 {
		case 'satrya' : 
		case 'Satrya' :
		return ctx.sendMessage( 'Nama : Satrya Budi Pratama' + '\n' +
									'NIM : 1301154428' + '\n'  );
		//return ctx.sendMessage('Nama : Satrya');
		break;

		case "aditya" :
		case "Aditya" : 
		return ctx.sendMessage( 'Nama : Aditya Setiawan' + '\n' +
									'NIM : 1301154218' + '\n'  );						
		break;

		case "Ahmad" : 
		case "ahmad" :
		case "iwan"	:
		return ctx.sendMessage( 'Nama : Ahmad Fikri Listyawan' + '\n' +
									'NIM : 1301154260' + '\n'  );						
		break;

		case "aisah" :
		case "Aisah" :
		case "ai"	: 
		return ctx.sendMessage( 'Nama : Aisah Mujahidah Rasunah' + '\n' +
									'NIM : 1301154484' + '\n'  );						
		break;

		case "Alfian" :
		case "alfian" :
		return ctx.sendMessage( 'Nama : Alfian Ibadurachman ' + '\n' +
									'NIM : 1301154120' + '\n'  );						
		break;

		case "Ali" :
		case "ali" :
		return ctx.sendMessage( 'Nama : Ali Helmut ' + '\n' +
									'NIM : 1301154246' + '\n'  );						
		break;

		case "Amhar" :
		case "amhar" :
		case "aha"	:
		return ctx.sendMessage( 'Nama : Amhar Hadikusumo ' + '\n' +
									'NIM : 1301154316' + '\n'  );						
		break;

		case "Andhika" : 
		case "Dika" : 
		case "dika" : 
		case "andhika" : 
		return ctx.sendMessage( 'Nama : Andhika Buwananda Nugraha ' + '\n' +
									'NIM : 1301154288' + '\n'  );						
		break;

		case "Salama" : 
		case "salama" : 
		case "Anisa" : 
		case "anisa" : 
		return ctx.sendMessage( 'Nama : Anisa Salama ' + '\n' +
									'NIM : 1301154640' + '\n'  );						
		break;

		case "Annisa" : 
		case "annisa" : 
		return ctx.sendMessage( 'Nama : Annisa Rohimma' + '\n' +
									'NIM : 1301154512' + '\n'  );						
		break;

		case "Farel" : 
		case "farel" : 
		case "Arieffarel" : 
		case "arieffarel" : 
		return ctx.sendMessage( 'Nama : Arieffarrel Edwin Pribadi ' + '\n' +
									'NIM : 1301154344' + '\n'  );						
		break;

		case "Ary" : 
		case "ary" : 
		return ctx.sendMessage( 'Nama : Ary Adhigana Suwandi ' + '\n' +
									'NIM : 1301154414' + '\n'  );						
		break;

		case "Chiara" : 
		case "chiara" : 
		case "Cakra" : 
		case "cakra" : 
		return ctx.sendMessage( 'Nama : Chiara Janetra Cakravania ' + '\n' +
									'NIM : 1301154400' + '\n'  );						
		break;

		case "Danas" : 
		case "danas" : 
		case "Danasawara" : 
		case "danasawara" : 
		return ctx.sendMessage( 'Nama : Danaswara Prawira Harja ' + '\n' +
									'NIM : 1301154148' + '\n'  );						
		break;

		case "Danny" : 
		case "danny" : 
		case "dani" : 
		case "Dani" : 
		return ctx.sendMessage( 'Nama : Danny Aldian Pratama ' + '\n' +
									'NIM : 1301154204' + '\n'  );						
		break;

		case "Dhian" : 
		case "dhian" : 
		case "Dhibeks" : 
		case "dhibeks" : 
		return ctx.sendMessage( 'Nama : Dhian Haryono ' + '\n' +
									'NIM : 1301154190' + '\n'  );						
		break;

		case "Dhiya" : 
		case "dhiya" : 
		case "Jarvis" : 
		case "jarvis" : 
		return ctx.sendMessage( 'Nama : Dhiya Ulhaq Dewangga ' + '\n' +
									'NIM : 1301150050' + '\n'  );						
		break;

		case "Ekky" : 
		case "ekky" : 
		return ctx.sendMessage( 'Nama : Ekky Wicaksana ' + '\n' +
									'NIM : 1301154358' + '\n'  );						
		break;

		case "Roi" : 
		case "Elroi" : 
		case "elroi" : 
		case "roi" : 
		return ctx.sendMessage( 'Nama : Elroi Christian Ndun ' + '\n' +
									'NIM : 1301150008' + '\n'  );						
		break;

		case "Hafizh" : 
		case "Hafizhuddin" : 
		case "hafizh" : 
		case "hafizhuddin" : 
		return ctx.sendMessage( 'Nama : Hafizhuddin ' + '\n' +
									'NIM : 1301150022' + '\n'  );						
		break;

		case "Hamzah" : 
		case "hamzah" : 
		return ctx.sendMessage( 'Nama : Hamzah ' + '\n' +
									'NIM : 1301150078' + '\n'  );						
		return ctx.sendMessage( 'Nama : Hamzah Faisal Azmi ' + '\n' +
									'NIM : 1301154372' + '\n'  );						
		break;
 
		case "Hilal" : 
		case "Nabil" :
		case "hilal" : 
		case "nabil" : 
		return ctx.sendMessage( 'Nama : Hilal Nabil Abdillah ' + '\n' +
									'NIM : 1301154134' + '\n'  );						
		break;

		case "Iqbal" : 
		case "iqbal" : 
		return ctx.sendMessage( 'Nama : Iqbal Basyar ' + '\n' +
									'NIM : 1301150036' + '\n'  );						
		break;
		case "Ayyub" : 
		case "ayyub" : 
		return ctx.sendMessage( 'Nama : M. Salahuddin Al Ayyubi ' + '\n' +
									'NIM : 1301154232' + '\n'  );						
		break;
		case "Chio" : 
		case "chio" : 
		case "Marchio" : 
		case "marchio" : 
		return ctx.sendMessage( 'Nama : Marchio Farantino ' + '\n' +
									'NIM : 1301154302' + '\n'  );						
		break;

		case "maya" : 
		case "Maya" : 
		return ctx.sendMessage( 'Nama : Maya Rosalinda ' + '\n' +
									'NIM : 1301154540' + '\n'  );						
		break;
		case "Meilinda" : 
		case "meilinda" : 
		case "mei" : 
		case "Mei" : 
		return ctx.sendMessage( 'Nama : Meilinda Khusnul Khotimah ' + '\n' +
									'NIM : 1301154568' + '\n'  );						
		break;
		case "Farrell" : 
		case "farrell" : 
		return ctx.sendMessage( 'Nama : Mochammad Farrell ' + '\n' +
									'NIM : 1301154162' + '\n'  );						
		break;
		case "Dzaky" : 
		case "dzaky" : 
		case "Amal" : 
		 return ctx.sendMessage( 'Nama : Muhammad Amal Dzaky ' + '\n' +
									'NIM : 1301154176' + '\n'  );						
		break;
		case "Restu" : 
		case "restu" : 
		return ctx.sendMessage( 'Nama : Muhammad Restu Novriyanata ' + '\n' +
									'NIM : 1301154092' + '\n'  );						
		break;
		case "Imam" : 
		case "imam" : 
		case "Raden" : 
		case "raden" : 
		return ctx.sendMessage( 'Nama : Raden Muhammad Imam ' + '\n' +
									'NIM : 1301154106' + '\n'  );						
		break;
		case "Reina" : 
		case "reina" : 
		return ctx.sendMessage( 'Nama : Reina Wardhani ' + '\n' +
									'NIM : 1301154470' + '\n'  );						
		break;
		case "Vana" : 
		case "Rifana" :
		case "vana" : 
		case "rifana" : 
		return ctx.sendMessage( 'Nama : Rifana Iftitah ' + '\n' +
									'NIM : 1301154274' + '\n'  );						
		break;
		case "Trio" : 
		case "trio" : 
		return ctx.sendMessage( 'Nama : Rizki Trio Novendra ' + '\n' +
									'NIM : 1301154386' + '\n'  );						
		break;
		case "Rizki" : 
		case "rizki" : 
		case "Yusnimar" : 
		case "yusnimar" : 
		return ctx.sendMessage( 'Nama : Rizki Yusnimar ' + '\n' +
									'NIM : 1301154526' + '\n'  );						
		break;
		case "Tamara" : 
		case "tamara" : 
		return ctx.sendMessage( 'Nama : Tamara Suci Pendok Mandouw ' + '\n' +
									'NIM : 1301154456' + '\n'  );						
		break;
		case "Taufik" : 
		case "taufik" : 
		return ctx.sendMessage( 'Nama : Taufik Muarif ' + '\n' +
									'NIM : 1301150064' + '\n'  );						
		break;
		case "Timami" : 
		case "timami" : 
		return ctx.sendMessage( 'Nama : Timami Hertza Putrisanni ' + '\n' +
									'NIM : 1301154498' + '\n'  );						
		break;
		case "Tri" : 
		case "tri" : 
		return ctx.sendMessage( 'Nama : Tri Muryani ' + '\n' +
									'NIM : 1301150442' + '\n'  );						
		break;
		case "Zulfya" : 
		case "zulfya" : 
		case "zul" : 
		case "Zul" : 
		return ctx.sendMessage( 'Nama : Zulfya Annisa Praditha ' + '\n' +
									'NIM : 1301154554' + '\n'  );						
		break;

		default :
		return ctx.sendMessage('main.notfound');
		return ctx.repeat();
		break;
	 }	

});
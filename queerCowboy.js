
// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!

// Twitter Essentials
// Twitter Library
var Twit = require('twit');

const request = require('request')

// Include configuration file
var T = new Twit(require('./config.js'));

// Helper function for arrays, picks a random thing
Array.prototype.pick = function() {
	return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// // Wordnik stuff
// function nounUrl(minCorpusCount, limit) {
// 	return "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=noun&minCorpusCount=" + minCorpusCount + "&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
// }

function getQuote() {
	return "https://api.quotable.io/random?tags=self%7Ccharacter%7Chappiness%7Cinspirational%7Clove";
}

function getGif() {
	return "https://cataas.com/cat/gif?html=true";
}

// turn long string of quote info into map of with just author and content
function cleanQuote(data) {
	console.log(data);
	var pairs = data.split("\"");
	var cquote = [];
	cquote[pairs[5]] = pairs[7];
	cquote[pairs[9]] = pairs[11];
	console.log(cquote);
	return cquote
}

// Post a status update
function tweet(message) {

	if(debug) 
		console.log('Debug mode: ', message);
	else
		T.post('statuses/update', {status: message }, function (err, reply) {
			if (err != null){
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', message);
			}
		});
}

function tweetImage(message, image) {

	if(debug) 
		console.log('Debug mode: ', message);
	else
		T.post('statuses/update', {status: message, media_id: image}, function (err, reply) {
			if (err != null){
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', message);
			}
		});
}

function followAMentioner() {
	T.get('statuses/mentions_timeline', { count:50, include_rts:1 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  	var sn = reply.pick().user.screen_name;
			if (debug) 
				console.log(sn);
			else {
				//Now follow that user
				T.post('friendships/create', {screen_name: sn }, function (err, reply) {
					if (err !== null) {
						console.log('Error: ', err);
					}
					else {
						console.log('Followed: ' + sn);
					}
				});
			}
		}
	});
}

function respondToMention() {
	T.get('statuses/mentions_timeline', { count:100, include_rts:0 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  	mention = reply.pick();
		  	mentionId = mention.id_str;
		  	mentioner = '@' + mention.user.screen_name;
		  	
		  	var tweet = mentioner + " " + pre.pick();
			if (debug) 
				console.log(tweet);
			else
				T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId }, function(err, reply) {
					if (err !== null) {
						console.log('Error: ', err);
					}
					else {
						console.log('Tweeted: ', tweet);
					}
				});
		  }
	});
}

function runBot() {
	console.log(" "); // just for legible logs
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds);  // date/time of the request	

	request(getQuote(), function(err, response, data) {
		if (err != null) return; // bail if no data
		var quote = cleanQuote(data);

		//tweet("Today's Daily quote:\n\"" + quote.content + "\" - " + quote.author); // tweeting out a random quote
	});

	request(getGif(), function(err, response, data) {
		if (err != null) return; // bail if no data

		console.log(data);
		tweetImage("test2", "/cat/fd5LzhKOnctOyhmK"); // tweeting out a random cat gif
	});
}

// Run the bot
runBot();

// And recycle every 15 minutes
setInterval(runBot, 1000 * 60 * 15);


// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!

// Twitter Essentials
// Twitter Library
var Twit = require('twit');

const fs = require('fs')
const request = require('request')

// Include configuration file
var T = new Twit(require('./config.js'));

var replies = [];

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

function inReplies(ele) {
	for (var i = 0; i < replies.length; i++) {
		if (replies[i].id == ele.id) {
			return true;
		}
	}
	return false;
}

function getQuote() {
	return "https://api.quotable.io/random?tags=self%7Ccharacter%7Chappiness%7Cinspirational%7Clove";
}

function getGif() {
	return "https://cataas.com/cat/gif";
}

// turn long string of quote info into map of with just author and content
function cleanQuote(data) {
	// console.log(data);
	var pairs = data.split("\"");
	var cquote = [];
	cquote[pairs[5]] = pairs[7];
	cquote[pairs[9]] = pairs[11];
	console.log(cquote);
	return cquote
}

// media upload methods

const initMediaUpload = (pathToFile) => {
    const mediaType = "image/gif";
    const mediaSize = fs.statSync(pathToFile).size
    return new Promise((resolve, reject) => {
        T.post("media/upload", {
            command: "INIT",
            total_bytes: mediaSize,
            media_type: mediaType
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(data.media_id_string)
            }
        })
    })
}

const appendMedia = (mediaId, pathToFile) => {
    const mediaData = fs.readFileSync(pathToFile)
    return new Promise((resolve, reject) => {
        T.post("media/upload", {
            command: "APPEND",
            media_id: mediaId,
            media: mediaData,
            segment_index: 0
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(mediaId)
            }
        })
    })
}

const finalizeMediaUpload = (mediaId) => {
    return new Promise((resolve, reject) =>  {
        T.post("media/upload", {
            command: "FINALIZE",
            media_id: mediaId
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(mediaId)
            }
        })
    })
}

// Post a status update
function tweet(message) {

	if(debug) 
		console.log('Debug mode: ', message);
	else
		T.post('statuses/update', {status: message}, function (err, reply) {
			if (err != null){
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', message);
			}
		});
}

function tweetImage(message) {
	//request(getGif()).pipe(fs.createWriteStream('cat.gif'));

	if(debug) 
		console.log('Debug mode: ', message);
	else
		initMediaUpload("cat.gif")
			.then((mediaId) => appendMedia(mediaId, "cat.gif"))
			.then((mediaId) => finalizeMediaUpload(mediaId))
			.then((mediaId) => {
				T.post('statuses/update', {status: message, media_id: mediaId}, function (err, reply) {
					if (err != null){
						console.log('Error: ', err);
					}
					else {
						console.log('Tweeted: ', message);
					}
				});
			});
}

function respondToMention(message) {
	T.get('statuses/mentions_timeline', { count:10, include_rts:0 },  function (err, reply) {
		var mention = null;

		//check if we've already replied to the mentions
		for (var i = 0; i < reply.length; i++) {
			if (!inReplies(reply[i])) {
				mention = reply[i];
				break;
			}
		}
		
		if (mention != null) {		//if there's a new mention that we haven't replied to:
			console.log(mention);
			mentionId = mention.id_str;
			mentioner = "@" + mention.user.screen_name;
			sn = mention.user.screen_name
			
			var tweet = mentioner + " " + message;
			console.log(tweet);
			if (debug) {
				console.log("debug mode:");
				console.log(tweet);
			} else {
				//tweet the reply
				T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId}, function(err2, reply2) {
					if (err2 != null) {
						console.log('Error: ', err2);
					}
					else {
						console.log('Tweeted: ', tweet);

						//add reply data to list of replies so that we dont reply to the smae thing twice
						replies[replies.length] = mention;

						//Follow the user we replied to
						T.post('friendships/create', {screen_name: sn }, function (err, reply) {
							if (err !== null) {
								console.log('Error: ', err);
							}
							else {
								console.log('Followed: ' + sn);
							}
						});
					}
				});
			}
		}
	});
}

function runBot() {
	console.log(" "); // just for legible logs
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds);  // date/time of the request	

	//Tweet with just quote
	request(getQuote(), function(err, response, data) {
		if (err != null) return; // bail if no data
		var quote = cleanQuote(data);

		//tweet("Today's Daily quote:\n\"" + quote.content + "\" - " + quote.author); // tweeting out a random quote
	});

	//Tweet with quote and cute gif
	request(getQuote(), function(err, response, data) {
		if (err != null) return; // bail if no data
		var quote = cleanQuote(data);

		tweetImage("Today's Daily quote:\n\"" + quote.content + "\" - " + quote.author); // sending in random quote
	});

	request(getGif()).pipe(fs.createWriteStream('cat.gif'))

	//Tweet reply to mention
	request(getQuote(), function(err, response, data) {
		if (err != null) return; // bail if no data
		var quote = cleanQuote(data);

		//respondToMention("here's a quote just for you:\n\"" + quote.content + "\" - " + quote.author); //replying to someone with a quote
	})
}

// Run the bot
runBot();

// And recycle every 15 minutes
setInterval(runBot, 1000 * 60 * 15);

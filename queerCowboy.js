// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!

// Twitter Essentials
// Twitter Library
var Twit = require('twit');

const fs = require('fs')
const request = require('request')
const path = require('path');

// Include configuration file
var T = new Twit(require('./config.js'));

var replies = [];

var time = 0

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
	return "https://cataas.com/cat";
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
	request(getGif()).pipe(fs.createWriteStream('cat.png'));

	if(debug) 
		console.log('Debug mode: ', message);
	else {
		var mediaFile = fs.readFileSync(path.join(__dirname, 'cat.png'));
		var base64image = Buffer.from(mediaFile).toString('base64');
		
		T.post('media/upload', { media_data: base64image, media_type: "image/png" }, function(err, data, response) {
			console.log('You successfully uploaded media');
			var mediaIdStr = data.media_id_string;
			var params2 = {media_id: mediaIdStr, alt_text: {text: "cats"}};
			var params1 = {status: 'Image Test!', media_ids: [mediaIdStr]};
			T.post('media/metadata/create', params2, function(err, data, response) {
				if (err != null) {
					console.log('Error: ', err);
				}
				else {
					T.post('statuses/update', params1, function(err, data, response) {
						console.log(data);
					});
				}
			})
		})
	}
	
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

function tweetImageAtUser(message) {
	request(getGif()).pipe(fs.createWriteStream('cat.png'));

	if(debug) 
		console.log('Debug mode: ', message);
	else {
		var mediaFile = fs.readFileSync(path.join(__dirname, 'cat.png'));
		var base64image = Buffer.from(mediaFile).toString('base64');
		
		T.post('media/upload', { media_data: base64image, media_type: "image/png" }, function(err, data, response) {
			console.log('You successfully uploaded media');
			var mediaIdStr = data.media_id_string;
			var params2 = {media_id: mediaIdStr, alt_text: {text: "The cutest cate EVER!!!"}};
			T.post('media/metadata/create', params2, function(err, data, response) {
				if (err != null) {
					console.log('Error: ', err);
				}
				else {
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
							// get user and tweet data
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
								T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId, media_ids: [mediaIdStr]}, function(err2, reply2) {
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
			})
		})
	}
	
}

function respondtoHashtag() {
	T.get('search/tweets',  {q: "#sad", count: 50, result_type: "recent"}, function (error, data) { //get 50 most recent tweets using #sad
		// log out any errors and responses
		console.log(error, data);
		// If our search request to the server had no errors...
		if (!error) {
			request(getGif()).pipe(fs.createWriteStream('cat.png'));
			var mention = data.statuses.pick();
			if(!debug) {
				var mediaFile = fs.readFileSync(path.join(__dirname, 'cat.png'));
				var base64image = Buffer.from(mediaFile).toString('base64');
				
				T.post('media/upload', { media_data: base64image, media_type: "image/png" }, function(err, data, response) {
					console.log('You successfully uploaded media');
					var mediaIdStr = data.media_id_string;
					var params2 = {media_id: mediaIdStr, alt_text: {text: "The cutest cate EVER!!!"}};
					T.post('media/metadata/create', params2, function(err, data, response) {
						if (err != null) {
							console.log('Error: ', err);
						}
						else {
									// get user and tweet data
									console.log(mention);
									mentionId = mention.id_str;
									mentioner = "@" + mention.user.screen_name;
									sn = mention.user.screen_name
									
									var tweet = mentioner;
									console.log(tweet);
									if (debug) {
										console.log("debug mode:");
										console.log(tweet);
									} else {
										//tweet the reply
										T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId, media_ids: [mediaIdStr]}, function(err2, reply2) {
											if (err2 != null) {
												console.log('Error: ', err2);
											}
											else {
												console.log('Tweeted: ', tweet);
						
												//add reply data to list of replies so that we dont reply to the smae thing twice
												replies[replies.length] = mention;
											}
										});
									}
						}
					})
				})
			}
		}
		// However, if our original search request had an error, we want to print it out here.
		else {
			console.log('There was an error with your hashtag search:', error);
		}
	  });
}

function isTime() {
	var d = new Date(); // retrieve current date, depends on the time zone set on the user's computer
	var hour = d.getHours(); 
	var minutes = d.getMinutes();

	return ((hour - 9 == 0) && ((minutes >= 0) || (minutes <= 15))); // returns true if the current time is between 9:00am - 9:15am
}

function runBot() {
	console.log(" "); // just for legible logs
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds);  // date/time of the request	

	// Daily tweet with just quote
	if (isTime()) { //  will post the daily tweet between 9:00:00AM - 9:15:00AM Eastern Time
		request(getQuote(), function(err, response, data) {
			if (err != null) return; // bail if no data
			var quote = cleanQuote(data);
	
			tweet("Today's Daily Quote:\n\"" + quote.content + "\" - " + quote.author); // tweeting out a random quote
		});
	}
	

	//Tweet with quote and cute photo
	request(getQuote(), function(err, response, data) {
		if (err != null) return; // bail if no data
		var quote = cleanQuote(data);

		tweetImageAtUser("Here's a quote just for you:\n\"" + quote.content + "\" - " + quote.author); // sending in random quote with image to someone
	});


	//Tweet reply to mention with just quote
	request(getQuote(), function(err, response, data) {
		if (err != null) return; // bail if no data
		var quote = cleanQuote(data);

		respondToMention("Here's a quote just for you:\n\"" + quote.content + "\" - " + quote.author); //replying to someone with a quote
	})

	//tweet just cute image to someone using #sad
	respondtoHashtag();
}

// Run the bot
runBot();

// And recycle every 15 minutes
setInterval(runBot, 1000 * 60 * 15);
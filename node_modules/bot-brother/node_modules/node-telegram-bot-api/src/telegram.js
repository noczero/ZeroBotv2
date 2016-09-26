var TelegramBotWebHook = require('./telegramWebHook');
var TelegramBotPolling = require('./telegramPolling');
var debug = require('debug')('node-telegram-bot-api');
var EventEmitter = require('events').EventEmitter;
var Promise = require("bluebird");
var request = require("requestretry");
var stream = require('stream');
var util = require('util');
var mime = require('mime');
var path = require('path');
var URL = require('url');
var fs = require('fs');

var requestPromise = Promise.promisify(request);

/**
 * Both request method to obtain messages are implemented. To use standard polling, set `polling: true`
 * on `options`. Notice that [webHook](https://core.telegram.org/bots/api#setwebhook) will need a valid (not self signed) SSL certificate.
 * Emmits `message` when a message arrives.
 *
 * @class TelegramBot
 * @constructor
 * @param {String} token Bot Token
 * @param {Object} [options]
 * @param {Boolean|Object} [options.polling=false] Set true to enable polling or set options
 * @param {String|Number} [options.polling.timeout=4] Polling time
 * @param {String|Number} [options.polling.interval=2000] Interval between requests in miliseconds
 * @param {Boolean|Object} [options.webHook=false] Set true to enable WebHook or set options
 * @param {String} [options.webHook.key] PEM private key to webHook server
 * @param {String} [options.webHook.cert] PEM certificate key to webHook server
 * @see https://core.telegram.org/bots/api
 */
var TelegramBot = function (token, options) {
  options = options || {};
  this.token = token;

  var processUpdate = this._processUpdate.bind(this);

  if (options.polling) {
    this._polling = new TelegramBotPolling(token, options.polling, processUpdate);
  }

  if (options.webHook) {
    this._webHook = new TelegramBotWebHook(token, options.webHook, processUpdate);
  }
};

util.inherits(TelegramBot, EventEmitter);

TelegramBot.prototype.messageTypes = [
  'text', 'audio', 'document', 'photo', 'sticker', 'video', 'voice', 'contact',
  'location', 'new_chat_participant', 'left_chat_participant', 'new_chat_title',
  'new_chat_photo', 'delete_chat_photo', 'group_chat_created'
];
TelegramBot.prototype.textRegexpCallbacks = [];

TelegramBot.prototype._processUpdate = function (update) {
  debug('Process Update %j', update);
  var message = update.message;
  var inline_query = update.inline_query;
  var chosen_inline_result = update.chosen_inline_result;

  if (message) {
    debug('Process Update message %j', message);
    this.emit('message', message);
    var processMessageType = function (messageType) {
      if (message[messageType]) {
        debug('Emtting %s: %j', messageType, message);
        this.emit(messageType, message);
      }
    };
    this.messageTypes.forEach(processMessageType.bind(this));
    if (message.text) {
      debug('Text message');
      this.textRegexpCallbacks.forEach(function (reg) {
        debug('Matching %s whith', message.text, reg.regexp);
        var result = reg.regexp.exec(message.text);
        if (result) {
          debug('Matches', reg.regexp);
          reg.callback(message, result);
        }
      });
    }
  } else if(inline_query) {
    debug('Process Update inline_query %j', inline_query);
    this.emit('inline_query', inline_query);
  } else if(chosen_inline_result) {
    debug('Process Update chosen_inline_result %j', chosen_inline_result);
    this.emit('chosen_inline_result', chosen_inline_result);
  }
};

TelegramBot.prototype._request = function (path, options) {
  if (!this.token) {
    throw new Error('Telegram Bot Token not provided!');
  }
  options = options || {};
  options.method = options.method || 'POST';
  options.url = URL.format({
    protocol: 'https',
    host: 'api.telegram.org',
    pathname: '/bot'+this.token+'/'+path
  });
  
  var fdata = options.formData || {};
  var fileSend = Object.keys(fdata).some(function (k) {
    return fdata[k].value instanceof stream.Stream || Buffer.isBuffer(fdata[k].value);
  });
  debug('file send', fileSend)
  fileSend = false;
  if (options.method === 'POST' && !fileSend) {
    options.formData = options.formData || {};
    Object.keys(options.qs || {}).forEach(function (k) {
      if (options.qs[k] !== undefined) {
        options.formData = options.formData || {};
        options.formData[k] = options.qs[k];
      }
      delete options.qs[k];
    });
  }
  Object.keys(options.qs || {}).forEach(function (key) {
   if (options.qs[key] === undefined) {
     delete options.qs[key];
   }
  });
  if (!fileSend && options.formData && !Object.keys(options.formData).length) {
    delete options.formData;
  }

  options.maxAttempts = 20;   // (default) try 5 times
  options.retryDelay = 1000;  // (default) wait for 5s before trying again
  options.retryStrategy = request.RetryStrategies.NetworkError; // (default) retry on 5xx or network errors

  debug('HTTP request: %j', options);
  return requestPromise(options)
    .then(function (resp) {
      if (resp[0].statusCode !== 200) {
        throw new Error(resp[0].statusCode+' '+resp[0].body);
      }
      var data = JSON.parse(resp[0].body);
      if (data.ok) {
        return data.result;
      } else {
        throw new Error(data.error_code+' '+data.description);
      }
    });
};

TelegramBot.prototype.onText = function (regexp, callback) {
    this.textRegexpCallbacks.push({regexp: regexp, callback: callback});
};

/**
 * Returns basic information about the bot in form of a `User` object.
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#getme
 */
TelegramBot.prototype.getMe = function () {
  var path = 'getMe';
  return this._request(path);
};

/**
 * Specify an url to receive incoming updates via an outgoing webHook.
 * @param {String} url URL where Telegram will make HTTP Post. Leave empty to
 * delete webHook.
 * @param {String|stream.Stream} [cert] PEM certificate key (public).
 * @see https://core.telegram.org/bots/api#setwebhook
 */
TelegramBot.prototype.setWebHook = function (url, cert) {
  var path = 'setWebhook';
  var opts = {qs: {url: url}};
  if (cert) {
    var content = this._formatSendData('certificate', cert);
    opts.formData = content[0];
  }
  return this._request(path, opts)
    .then(function (resp) {
      if (!resp) {
        throw new Error(resp);
      }
      return resp;
    });
};

/**
 * Use this method to receive incoming updates using long polling
 * @param  {Number|String} [timeout] Timeout in seconds for long polling.
 * @param  {Number|String} [limit] Limits the number of updates to be retrieved.
 * @param  {Number|String} [offset] Identifier of the first update to be returned.
 * @return {Promise} Updates
 * @see https://core.telegram.org/bots/api#getupdates
 */
TelegramBot.prototype.getUpdates = function (timeout, limit, offset) {
  var query = {
    offset: offset,
    limit: limit,
    timeout: timeout
  };

  return this._request('getUpdates', {qs: query});
};

/**
 * Send text message.
 * @param  {Number|String} chatId Unique identifier for the message recipient
 * @param  {String} text Text of the message to be sent
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendmessage
 */
TelegramBot.prototype.sendMessage = function (chatId, text, options) {
  var query = options || {};
  query.chat_id = chatId;
  query.text = text;
  return this._request('sendMessage', {qs: query, method: 'POST'});
};

/**
 * Send answers to an inline query.
 * @param  {String} queryId Unique identifier of the query
 * @param  {Array of InlineQueryResult} results An array of results for the inline query
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#answerinlinequery
 */
TelegramBot.prototype.answerInlineQuery = function (inline_query_id, results, options) {
  var form = options || {};
  form.inline_query_id = inline_query_id;
  form.results = JSON.stringify(results);
  return this._request('answerInlineQuery', {form: form});
};


/**
 * Forward messages of any kind.
 * @param  {Number|String} chatId     Unique identifier for the message recipient
 * @param  {Number|String} fromChatId Unique identifier for the chat where the
 * original message was sent
 * @param  {Number|String} messageId  Unique message identifier
 * @return {Promise}
 */
TelegramBot.prototype.forwardMessage = function (chatId, fromChatId, messageId) {
  var query = {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId
  };
  return this._request('forwardMessage', {qs: query, method: 'POST'});
};

TelegramBot.prototype._formatSendData = function (type, data) {
  var formData;
  var fileName;
  var fileId;
  if (data instanceof stream.Stream) {
    fileName = URL.parse(path.basename(data.path)).pathname;
    formData = {};
    formData[type] = {
      value: data,
      options: {
        filename: fileName,
        contentType: mime.lookup(fileName)
      }
    };
  } else if (data.indexOf('/') === 0) {
    fileName = path.basename(data);
    formData = {};
    formData[type] = {
      value: fs.createReadStream(data),
      options: {
        filename: fileName,
        contentType: mime.lookup(fileName)
      }
    };
  } else {
    fileId = data;
  }
  return [formData, fileId];
};

/**
 * Send photo
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {String|stream.Stream} photo A file path or a Stream. Can
 * also be a `file_id` previously uploaded
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendphoto
 */
TelegramBot.prototype.sendPhoto = function (chatId, photo, options) {
  var opts = {
    qs: options || {},
    method: 'POST'
  };
  opts.qs.chat_id = chatId;
  var content = this._formatSendData('photo', photo);
  opts.formData = content[0];
  opts.qs.photo = content[1];
  return this._request('sendPhoto', opts);
};

/**
 * Send audio
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {String|stream.Stream} audio A file path or a Stream. Can
 * also be a `file_id` previously uploaded.
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendaudio
 */
TelegramBot.prototype.sendAudio = function (chatId, audio, options) {
  var opts = {
    qs: options || {}
  };
  opts.qs.chat_id = chatId;
  var content = this._formatSendData('audio', audio);
  opts.formData = content[0];
  opts.qs.audio = content[1];
  return this._request('sendAudio', opts);
};

/**
 * Send Document
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {String|stream.Stream} A file path or a Stream. Can
 * also be a `file_id` previously uploaded.
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendDocument
 */
TelegramBot.prototype.sendDocument = function (chatId, doc, options) {
  var opts = {
    qs: options || {}
  };
  opts.qs.chat_id = chatId;
  var content = this._formatSendData('document', doc);
  opts.formData = content[0];
  opts.qs.document = content[1];
  return this._request('sendDocument', opts);
};

/**
 * Send .webp stickers.
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {String|stream.Stream} A file path or a Stream. Can
 * also be a `file_id` previously uploaded.
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendsticker
 */
TelegramBot.prototype.sendSticker = function (chatId, sticker, options) {
  var opts = {
    qs: options || {}
  };
  opts.qs.chat_id = chatId;
  var content = this._formatSendData('sticker', sticker);
  opts.formData = content[0];
  opts.qs.sticker = content[1];
  return this._request('sendSticker', opts);
};

/**
 * Send video files, Telegram clients support mp4 videos (other formats may be sent with `sendDocument`)
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {String|stream.Stream} A file path or a Stream. Can
 * also be a `file_id` previously uploaded.
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendvideo
 */
TelegramBot.prototype.sendVideo = function (chatId, video, options) {
  var opts = {
    qs: options || {}
  };
  opts.qs.chat_id = chatId;
  var content = this._formatSendData('video', video);
  opts.formData = content[0];
  opts.qs.video = content[1];
  return this._request('sendVideo', opts);
};


/**
 * Send chat action.
 * `typing` for text messages,
 * `upload_photo` for photos, `record_video` or `upload_video` for videos,
 * `record_audio` or `upload_audio` for audio files, `upload_document` for general files,
 * `find_location` for location data.
 *
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {String} action Type of action to broadcast.
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendchataction
 */
TelegramBot.prototype.sendChatAction = function (chatId, action) {
  var query = {
    chat_id: chatId,
    action: action
  };
  return this._request('sendChatAction', {qs: query});
};

/**
 * Use this method to get a list of profile pictures for a user.
 * Returns a [UserProfilePhotos](https://core.telegram.org/bots/api#userprofilephotos) object.
 *
 * @param  {Number|String} userId  Unique identifier of the target user
 * @param  {Number} [offset] Sequential number of the first photo to be returned. By default, all photos are returned.
 * @param  {Number} [limit] Limits the number of photos to be retrieved. Values between 1—100 are accepted. Defaults to 100.
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#getuserprofilephotos
 */
TelegramBot.prototype.getUserProfilePhotos = function (userId, offset, limit) {
  var query = {
    user_id: userId,
    offset: offset,
    limit: limit
  };
  return this._request('getUserProfilePhotos', {qs: query});
};

TelegramBot.prototype.getFile = function (fileId) {
  var query = {
    file_id: fileId
  };
  return this._request('getFile', {qs: query});
};

/**
 * Send location.
 * Use this method to send point on the map.
 *
 * @param  {Number|String} chatId  Unique identifier for the message recipient
 * @param  {Float} latitude Latitude of location
 * @param  {Float} longitude Longitude of location
 * @param  {Object} [options] Additional Telegram query options
 * @return {Promise}
 * @see https://core.telegram.org/bots/api#sendlocation
 */
TelegramBot.prototype.sendLocation = function (chatId, latitude, longitude, options) {
  var query = options || {};
  query.chat_id = chatId;
  query.latitude = latitude;
  query.longitude = longitude;
  return this._request('sendLocation', {qs: query});
};

/**
 * Stop listening
 */
TelegramBot.prototype.destroy = function () {
  if (this._polling) {
    this._polling.destroy();
  }
  if (this._webHook) {
    this._webHook.destroy();
  }
}

module.exports = TelegramBot;

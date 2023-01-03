(function () {
  var OrigWebSocket = window.WebSocket;
  var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
  var wsAddListener = OrigWebSocket.prototype.addEventListener;
  wsAddListener = wsAddListener.call.bind(wsAddListener);
  window.WebSocket = function WebSocket(url, protocols) {
    var ws;
    if (!(this instanceof WebSocket)) {
      // Called without 'new' (browsers will throw an error).
      ws = callWebSocket(this, arguments);
    } else if (arguments.length === 1) {
      ws = new OrigWebSocket(url);
    } else if (arguments.length >= 2) {
      ws = new OrigWebSocket(url, protocols);
    } else {
      // No arguments (browsers will throw an error)
      ws = new OrigWebSocket();
    }
    wsAddListener(ws, 'message', function (event) {
      document.dispatchEvent(new CustomEvent("WebSocketReceive", {
        detail: {
          data: event
        }
      }));
    });
    return ws;
  }.bind();
  window.WebSocket.prototype = OrigWebSocket.prototype;
  window.WebSocket.prototype.constructor = window.WebSocket;
  var wsSend = OrigWebSocket.prototype.send;
  wsSend = wsSend.apply.bind(wsSend);
  OrigWebSocket.prototype.send = function (data) {
    document.dispatchEvent(new CustomEvent("WebSocketSend", {
      detail: {
        data: data
      }
    }));
    return wsSend(this, arguments);
  };
})();
var XHR = XMLHttpRequest.prototype;
var open = XHR.open;
var send = XHR.send;
var setRequestHeader = XHR.setRequestHeader;
XHR.open = function () {
  this._requestHeaders = {};
  return open.apply(this, arguments);
};
XHR.setRequestHeader = function (header, value) {
  this._requestHeaders[header] = value;
  return setRequestHeader.apply(this, arguments);
};
XHR.send = function () {
  this.addEventListener('load', function () {
    var url = this.responseURL;
    var responseHeaders = this.getAllResponseHeaders();

    // Convert the header string into an array
    // of individual headers
    var arr = responseHeaders.trim().split(/[\r\n]+/);

    // Create a map of header names to values
    var headerMap = {};
    arr.forEach(function (line) {
      var parts = line.split(': ');
      var header = parts.shift();
      var value = parts.join(': ');
      headerMap[header] = value;
    });
    try {
      if (this.responseType != 'blob') {
        var responseBody;
        if (this.responseType === '' || this.responseType === 'text') {
          responseBody = JSON.parse(this.responseText);
        } else /* if (this.responseType === 'json') */{
            responseBody = this.response;
          }
        document.dispatchEvent(new CustomEvent("httpResponse", {
          detail: {
            url: url,
            status: this.status,
            responseHeaders: headerMap,
            responseBody: responseBody
          }
        }));
      }
    } catch (err) {
      console.debug("Error reading or processing response.", err);
    }
  });
  return send.apply(this, arguments);
};
